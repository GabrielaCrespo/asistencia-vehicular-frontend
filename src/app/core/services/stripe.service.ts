import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private http = inject(HttpClient);
  private baseUrl = environment.api.baseUrl;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  async initStripe(): Promise<void> {
    if (this.stripe) return;
    const config = await firstValueFrom(
      this.http.get<{ publishable_key: string }>(`${this.baseUrl}/api/stripe/config`)
    );
    this.stripe = await loadStripe(config.publishable_key);
    if (!this.stripe) throw new Error('No se pudo cargar Stripe');
  }

  mountCardElement(containerId: string): void {
    if (!this.stripe) throw new Error('Stripe no inicializado');
    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '15px',
          color: '#1e293b',
          fontFamily: 'Inter, system-ui, sans-serif',
          '::placeholder': { color: '#94a3b8' },
        },
        invalid: { color: '#ef4444' },
      },
      hidePostalCode: true,
    });
    this.cardElement.mount(`#${containerId}`);
  }

  destroyCardElement(): void {
    this.cardElement?.unmount();
    this.cardElement = null;
    this.elements = null;
  }

  async createCommissionPaymentIntent(pagoId: number): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ client_secret: string }>(
        `${this.baseUrl}/api/stripe/commission-payment-intent`,
        { pago_id: pagoId }
      )
    );
    return res.client_secret;
  }

  async createServicePaymentIntent(pagoId: number): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ client_secret: string }>(
        `${this.baseUrl}/api/stripe/payment-intent`,
        { pago_id: pagoId }
      )
    );
    return res.client_secret;
  }

  async confirmCardPayment(clientSecret: string): Promise<string> {
    if (!this.stripe || !this.cardElement) throw new Error('Stripe no inicializado');
    const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: this.cardElement },
    });
    if (error) throw new Error(error.message ?? 'Error al procesar el pago');
    return paymentIntent!.id;
  }

  async verificarPago(pagoId: number, paymentIntentId: string, tipo: string): Promise<void> {
    await firstValueFrom(
      this.http.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/api/stripe/verificar-pago`,
        { pago_id: pagoId, payment_intent_id: paymentIntentId, tipo }
      )
    );
  }
}
