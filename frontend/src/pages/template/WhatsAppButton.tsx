import { AiOutlineWhatsApp } from 'react-icons/ai';
import { useState, type CSSProperties } from 'react';
import { getPublicShopById } from '../../api/shop-service/shop-api';

type ThemeColors = {
  primary?: string;
  bg?: string;
  text?: string;
  accent?: string;
};

type CartItem = {
  name: string;
  quantity: number;
};

type Props = {
  shopId: string;
  shopName?: string;
  cartItems: CartItem[];
  themeColors?: ThemeColors;
  label?: string;
  className?: string;
  variant?: 'floating' | 'inline';
};

const formatItems = (cartItems: CartItem[]) =>
  cartItems.map((item) => `${item.quantity}x ${item.name}`).join(', ');

const WhatsAppButton = ({
  shopId,
  shopName,
  cartItems,
  themeColors,
  label = 'WhatsApp',
  className = '',
  variant = 'floating',
}: Props) => {
  const [loading, setLoading] = useState(false);

  const getStorePhone = async (id: string): Promise<string | null> => {
    try {
      const data = await getPublicShopById(id);
      return data.phoneNumber ?? null;
    } catch (error) {
      console.error('Error fetching shop phone:', error);
      return null;
    }
  };

  const cleanPhoneForWa = (raw: string) => raw.replace(/[^0-9+]/g, '').replace(/^\+/, '');

  const handleClick = async () => {
    if (cartItems.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const phone = await getStorePhone(shopId);

      if (!phone) {
        alert('No se encontró número de teléfono para la tienda');
        return;
      }

      const cleanPhone = cleanPhoneForWa(phone);
      if (!cleanPhone) {
        alert('Número de teléfono inválido');
        return;
      }

      const message = `Hola, estoy interesado en ${formatItems(cartItems)}, vengo de la tienda ${shopName ?? 'la tienda'}`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  };

  const buttonClassName =
    variant === 'floating'
      ? `fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-colors duration-300 ${className}`
      : `inline-flex items-center gap-2 rounded-md px-4 py-2 ${className}`;

  const buttonStyle: CSSProperties =
    variant === 'inline'
      ? {
          background: themeColors?.bg ?? 'rgba(13, 17, 23, 0.92)',
          border: `1px solid ${themeColors?.primary ?? '#39ff14'}`,
          color: themeColors?.primary ?? '#39ff14',
          boxShadow: `0 0 0 1px ${themeColors?.accent ?? 'rgba(57, 255, 20, 0.14)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '0.5rem',
          fontFamily: 'inherit',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          width: 'fit-content',
          minWidth: 'max-content',
        }
      : {
          background: themeColors?.primary ?? '#25d366',
          border: 'none',
          color: themeColors?.text ?? '#ffffff',
          boxShadow: `0 8px 20px ${themeColors?.accent ?? 'rgba(0, 0, 0, 0.22)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '0.5rem',
          whiteSpace: 'nowrap',
          width: 'fit-content',
          minWidth: 'max-content',
        };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={buttonClassName}
      style={buttonStyle}
    >
      <AiOutlineWhatsApp
        size={variant === 'floating' ? 20 : 18}
        style={{ flexShrink: 0, display: 'block', verticalAlign: 'middle' }}
      />
      <span style={{ lineHeight: 1, display: 'inline-block', whiteSpace: 'nowrap' }}>
        {loading ? 'Abriendo...' : label}
      </span>
    </button>
  );
};

export default WhatsAppButton;