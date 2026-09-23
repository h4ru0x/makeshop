set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Cargar credenciales desde ~/.aws/credentials y ~/.aws/config si faltan
PROFILE="${AWS_PROFILE:-default}"
AWS_CREDENTIALS_FILE="${AWS_SHARED_CREDENTIALS_FILE:-$HOME/.aws/credentials}"
AWS_CONFIG_FILE="${AWS_CONFIG_FILE:-$HOME/.aws/config}"

get_aws_ini_val() {
  local file="$1"
  local sec="$2"
  local key="$3"
  if [ -f "$file" ]; then
    awk -v sec="$sec" -v key="$key" '
      $0 ~ "^[[:space:]]*\\[" {
        line = $0;
        sub(/^[[:space:]]*\\[/, "", line);
        sub(/\\][[:space:]]*$/, "", line);
        sub(/^profile /, "", line);
        current_sec = line;
        next;
      }
      current_sec == sec && $0 ~ "=" {
        idx = index($0, "=");
        k = substr($0, 1, idx - 1);
        v = substr($0, idx + 1);
        sub(/^[[:space:]]+/, "", k); sub(/[[:space:]]+$/, "", k);
        sub(/^[[:space:]]+/, "", v); sub(/[[:space:]]+$/, "", v);
        if (k == key) {
          print v;
          exit;
        }
      }
    ' "$file" 2>/dev/null || true
  fi
}

if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
  VAL="$(aws configure get aws_access_key_id 2>/dev/null || true)"
  [ -z "$VAL" ] && VAL="$(get_aws_ini_val "$AWS_CREDENTIALS_FILE" "$PROFILE" "aws_access_key_id")"
  if [ -n "$VAL" ]; then
    export AWS_ACCESS_KEY_ID="$VAL"
  fi
fi

if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  VAL="$(aws configure get aws_secret_access_key 2>/dev/null || true)"
  [ -z "$VAL" ] && VAL="$(get_aws_ini_val "$AWS_CREDENTIALS_FILE" "$PROFILE" "aws_secret_access_key")"
  if [ -n "$VAL" ]; then
    export AWS_SECRET_ACCESS_KEY="$VAL"
  fi
fi

if [ -z "${AWS_SESSION_TOKEN:-}" ]; then
  VAL="$(aws configure get aws_session_token 2>/dev/null || true)"
  [ -z "$VAL" ] && VAL="$(get_aws_ini_val "$AWS_CREDENTIALS_FILE" "$PROFILE" "aws_session_token")"
  if [ -n "$VAL" ]; then
    export AWS_SESSION_TOKEN="$VAL"
  fi
fi

if [ -z "${AWS_REGION:-}" ] && [ -z "${AWS_DEFAULT_REGION:-}" ]; then
  VAL="$(aws configure get region 2>/dev/null || true)"
  [ -z "$VAL" ] && VAL="$(get_aws_ini_val "$AWS_CONFIG_FILE" "$PROFILE" "region")"
  if [ -n "$VAL" ]; then
    export AWS_REGION="$VAL"
  fi
fi

# 1) Variables base
STACK_NAME="openstore-stack"
TEMPLATE_FILE="cloud-formation.yml"
VPC_ID="${VPC_ID:-}"
KEY_NAME="${OPENSTORE_KEY_NAME:-${KEY_NAME:-}}"
CREATE_KEY_PAIR="false"

AWS_REGION_VALUE="${AWS_REGION:-${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}}"
if [ -z "$AWS_REGION_VALUE" ]; then
  AWS_REGION_VALUE="us-east-1"
fi

# Si no se pasa VPC_ID por .env, intenta usar la VPC por defecto de la región.
if [ -z "$VPC_ID" ]; then
  VPC_ID="$(aws ec2 describe-vpcs \
    --region "$AWS_REGION_VALUE" \
    --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || true)"

  if [ "$VPC_ID" = "None" ]; then
    VPC_ID=""
  fi
fi

# Fallback: Si no hay VPC por defecto, intenta tomar la primera VPC que exista en la región
if [ -z "$VPC_ID" ]; then
  VPC_ID="$(aws ec2 describe-vpcs \
    --region "$AWS_REGION_VALUE" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || true)"

  if [ "$VPC_ID" = "None" ]; then
    VPC_ID=""
  fi
fi

if [ -z "$VPC_ID" ]; then
  echo "ERROR: No se pudo obtener ninguna VPC_ID en la region $AWS_REGION_VALUE." >&2
  echo "" >&2
  echo "Causas posibles:" >&2
  echo " 1. Si usas credenciales temporales (tu AWS_ACCESS_KEY_ID inicia con 'ASIA'), te falta incluir AWS_SESSION_TOKEN en el archivo .env." >&2
  echo " 2. Tu cuenta en $AWS_REGION_VALUE no tiene una VPC por defecto ni otra VPC activa." >&2
  echo "" >&2
  echo "Solución:" >&2
  echo " - Agrega 'VPC_ID=vpc-xxxxxxxxx' manualmente en tu archivo .env" >&2
  echo " - Si usas AWS Academy / Learner Lab / SSO, agrega 'AWS_SESSION_TOKEN=...' en tu archivo .env" >&2
  exit 1
fi

if [ -z "${FRONTEND_AMPLIFY_ACCESS_TOKEN:-}" ]; then
  echo "Falta FRONTEND_AMPLIFY_ACCESS_TOKEN en .env" >&2
  echo "Agrega FRONTEND_AMPLIFY_ACCESS_TOKEN=ghp_xxx en .env y vuelve a ejecutar." >&2
  exit 1
fi

case "${FRONTEND_AMPLIFY_ACCESS_TOKEN}" in
  ghp_CHANGE_ME|ghp_tu_token_aqui|CHANGE_ME|"")
    echo "FRONTEND_AMPLIFY_ACCESS_TOKEN todavia tiene un valor de ejemplo." >&2
    echo "Crea un token real de GitHub y reemplazalo en cloud-aws/.env." >&2
    exit 1
    ;;
esac

if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && printf '%s' "$AWS_ACCESS_KEY_ID" | grep -q 'CHANGE_ME\|EXAMPLE'; then
  echo "AWS_ACCESS_KEY_ID todavia tiene un valor de ejemplo. Reemplaza las credenciales en cloud-aws/.env." >&2
  exit 1
fi

# 2) Reutilizar o crear Key Pair
if [ -z "$KEY_NAME" ]; then
  KEY_NAME="openstore-key-$(date +%Y%m%d%H%M%S)"
  CREATE_KEY_PAIR="true"
fi

if aws ec2 describe-key-pairs \
  --region "$AWS_REGION_VALUE" \
  --key-names "$KEY_NAME" \
  >/dev/null 2>&1; then
  echo "Reutilizando KeyName existente: $KEY_NAME"
else
  CREATE_KEY_PAIR="true"
fi

if [ "$CREATE_KEY_PAIR" = "true" ]; then
  aws ec2 create-key-pair \
    --region "$AWS_REGION_VALUE" \
    --key-name "$KEY_NAME" \
    --query 'KeyMaterial' \
    --output text > "${KEY_NAME}.pem"
  chmod 400 "${KEY_NAME}.pem"

  if [ -f ".env" ] && ! grep -q '^OPENSTORE_KEY_NAME=' .env; then
    printf '\nOPENSTORE_KEY_NAME=%s\n' "$KEY_NAME" >> .env
  fi
fi

# 3) Detectar 2 subnets de esa VPC en AZ distintas (prioriza a/b si existen)
mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
  --region "$AWS_REGION_VALUE" \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[].[SubnetId,AvailabilityZone]" \
  --output text)

# Fallback por si no hay suficientes subnets públicas
if [ ${#CANDIDATES[@]} -lt 2 ]; then
  mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
    --region "$AWS_REGION_VALUE" \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[].[SubnetId,AvailabilityZone]" \
    --output text)
fi

SUBNET1=""
SUBNET2=""
AZ1=""
REGION_AZ_A="${AWS_REGION_VALUE}a"
REGION_AZ_B="${AWS_REGION_VALUE}b"
SUBNET_A=""
SUBNET_B=""

for row in "${CANDIDATES[@]}"; do
  subnet_id=$(echo "$row" | awk '{print $1}')
  az=$(echo "$row" | awk '{print $2}')

  if [ "$az" = "$REGION_AZ_A" ] && [ -z "$SUBNET_A" ]; then
    SUBNET_A="$subnet_id"
  fi

  if [ "$az" = "$REGION_AZ_B" ] && [ -z "$SUBNET_B" ]; then
    SUBNET_B="$subnet_id"
  fi
done

if [ -n "$SUBNET_A" ] && [ -n "$SUBNET_B" ]; then
  SUBNET1="$SUBNET_A"
  SUBNET2="$SUBNET_B"
fi

if [ -z "$SUBNET1" ] || [ -z "$SUBNET2" ]; then
  for row in "${CANDIDATES[@]}"; do
    subnet_id=$(echo "$row" | awk '{print $1}')
    az=$(echo "$row" | awk '{print $2}')

    if [ -z "$SUBNET1" ]; then
      SUBNET1="$subnet_id"
      AZ1="$az"
      continue
    fi

    if [ "$az" != "$AZ1" ]; then
      SUBNET2="$subnet_id"
      break
    fi
  done
fi

if [ -z "$SUBNET1" ] || [ -z "$SUBNET2" ]; then
  echo "No se pudieron encontrar 2 subnets validas en AZ distintas para la VPC $VPC_ID en la region $AWS_REGION_VALUE" >&2
  echo "Diagnostico de subnets encontradas en esa VPC:" >&2
  aws ec2 describe-subnets \
    --region "$AWS_REGION_VALUE" \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[].[SubnetId,AvailabilityZone,MapPublicIpOnLaunch]" \
    --output table >&2 || true

  echo "Cantidad de subnets por AZ:" >&2
  aws ec2 describe-subnets \
    --region "$AWS_REGION_VALUE" \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[].AvailabilityZone" \
    --output text 2>/dev/null | tr '\t' '\n' | sort | uniq -c >&2 || true

  echo "No se pudieron encontrar 2 subnets validas en AZ distintas para la VPC $VPC_ID en la region $AWS_REGION_VALUE" >&2
  exit 1
fi

echo "Usando region AWS: $AWS_REGION_VALUE"
echo "Usando KeyName=$KEY_NAME"
echo "Usando Subnets: $SUBNET1 $SUBNET2"

# 4) Deploy CloudFormation
aws cloudformation deploy \
  --region "$AWS_REGION_VALUE" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    InstanceName="${INSTANCE_NAME:-MV-MakeShop}" \
    AMI=ami-08d434e92c0cfa0c0 \
    KeyName="$KEY_NAME" \
    InstanceType="${INSTANCE_TYPE:-t3.small}" \
    DbInstanceType="${DB_INSTANCE_TYPE:-t3.small}" \
    VpcId="$VPC_ID" \
    PublicSubnet1="$SUBNET1" \
    PublicSubnet2="$SUBNET2" \
    FrontendRepoUrl="${FRONTEND_REPO_URL:-https://github.com/Lazheart/MakeShop}" \
    FrontendBranchName="${FRONTEND_BRANCH_NAME:-main}" \
    FrontendAmplifyAppName="${FRONTEND_AMPLIFY_APP_NAME:-makeshop-frontend}" \
    FrontendAmplifyAccessToken="$FRONTEND_AMPLIFY_ACCESS_TOKEN" \
    DockerImageNamespace="${DOCKER_IMAGE_NAMESPACE:-lazheart}" \
    DockerImageTag="${DOCKER_IMAGE_TAG:-latest}"

# 5) Ver outputs finales (ALB/Amplify)
aws cloudformation describe-stacks \
  --region "$AWS_REGION_VALUE" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table

# 6) Iniciar compilación y despliegue automático del Frontend en AWS Amplify
APP_ID="$(aws cloudformation describe-stacks \
  --region "$AWS_REGION_VALUE" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendAmplifyAppId'].OutputValue" \
  --output text 2>/dev/null || true)"

BRANCH_NAME="${FRONTEND_BRANCH_NAME:-main}"

if [ -n "$APP_ID" ] && [ "$APP_ID" != "None" ]; then
  echo ""
  echo " Iniciando despliegue automático en AWS Amplify (AppID: $APP_ID, Branch: $BRANCH_NAME)..."
  aws amplify start-job \
    --region "$AWS_REGION_VALUE" \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-type RELEASE \
    --job-reason "Despliegue automatico post-provisionamiento desde SETUP.sh" >/dev/null && \
    echo " Compilación de Amplify iniciada correctamente. No necesitas iniciarla manualmente desde la consola." || \
    echo "  No se pudo iniciar el job de Amplify automáticamente. Revisa permisos de AWS CLI."
fi
