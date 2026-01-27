export {};

declare global {
  interface Window {
    MercadoPago?: {
      new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
    };
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => {
        render: (selector: string) => Promise<void>;
      };
    };
    gtag?: (...args: unknown[]) => void;
  }

  interface MercadoPagoCheckoutOptions {
    preference: {
      id: string;
    };
    autoOpen?: boolean;
    render?: {
      container: string;
      label: string;
    };
  }

  interface MercadoPagoInstance {
    checkout: (options: MercadoPagoCheckoutOptions) => Promise<void>;
    bricks: () => {
      create: (type: string, containerId: string, options: unknown) => Promise<unknown>;
    };
  }

  interface PayPalOrderActions {
    order: {
      create: (input: {
        purchase_units: {
          amount: {
            currency_code: string;
            value: string;
          };
          description: string;
        }[];
      }) => Promise<string>;
      capture: () => Promise<PayPalOrder>;
    };
  }

  interface PayPalButtonsConfig {
    createOrder?: (data: any, actions: PayPalOrderActions) => Promise<string>;
    onApprove?: (data: any, actions: PayPalOrderActions) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
    style?: {
      layout?: 'vertical' | 'horizontal';
      color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
      shape?: 'rect' | 'pill';
      label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
      height?: number;
    };
  }

  interface PayPalOrder {
    purchase_units: {
      amount: {
        value: string;
      };
    }[];
    id: string;
  }
}
