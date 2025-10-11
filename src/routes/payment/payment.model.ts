import z from 'zod'

export const PaymentTransactionSchema = z.object({
  id: z.number(),
  gateway: z.string(),
  transactionDate: z.coerce.date(),
  accountNumber: z.string().nullable(),
  subAccount: z.string().nullable(),
  amountIn: z.number(),
  amountOut: z.number(),
  accumulated: z.number(),
  code: z.string().nullable(),
  transactionContent: z.string().nullable(),
  referenceNumber: z.string().nullable(),
  body: z.string().nullable(),
  createdAt: z.date(),
})

// https://docs.sepay.vn/tich-hop-webhooks.html
// {
//   "id": 92704,                              // ID giao dịch trên SePay
//   "gateway":"Vietcombank",                  // Brand name của ngân hàng
//   "transactionDate":"2023-03-25 14:02:37",  // Thời gian xảy ra giao dịch phía ngân hàng
//   "accountNumber":"0123499999",              // Số tài khoản ngân hàng
//   "code":null,                               // Mã code thanh toán (sepay tự nhận diện dựa vào cấu hình tại Công ty -> Cấu hình chung)
//   "content":"chuyen tien mua iphone",        // Nội dung chuyển khoản
//   "transferType":"in",                       // Loại giao dịch. in là tiền vào, out là tiền ra
//   "transferAmount":2277000,                  // Số tiền giao dịch
//   "accumulated":19077000,                    // Số dư tài khoản (lũy kế)
//   "subAccount":null,                         // Tài khoản ngân hàng phụ (tài khoản định danh),
//   "referenceCode":"MBVCB.3278907687",         // Mã tham chiếu của tin nhắn sms
//   "description":""                           // Toàn bộ nội dung tin nhắn sms
// }
export const WebhookPaymentBodySchema = z.object({
  id: z.number(),
  gateway: z.string(),
  transactionDate: z.string(), // "2023-03-25 14:02:37"
  accountNumber: z.string().nullable(),
  code: z.string().nullable(),
  content: z.string().nullable(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number(),
  accumulated: z.number(),
  subAccount: z.string().nullable(),
  referenceCode: z.string().nullable(),
  description: z.string().nullable(),
})

export type PaymentTransactionType = z.infer<typeof PaymentTransactionSchema>
export type WebhookPaymentBodyType = z.infer<typeof WebhookPaymentBodySchema>
