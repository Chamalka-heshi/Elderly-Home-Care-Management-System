export interface PayHereNotifyDto {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  status_message?: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
}
