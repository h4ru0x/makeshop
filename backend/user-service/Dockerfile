FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -ntp dependency:go-offline

COPY src ./src
RUN mvn -ntp -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 appuser

COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
