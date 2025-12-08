package payment

type PaymentMethod string

const (
	MethodStripe  PaymentMethod = "stripe"
	MethodAlipay  PaymentMethod = "alipay"
	MethodWeChat  PaymentMethod = "wxpay"
	MethodBalance PaymentMethod = "balance"
)

// PayRequest 支付请求
type PayRequest struct {
	OrderID     string        `json:"order_id"`
	Amount      float64       `json:"amount"` // 元
	Description string        `json:"description"`
	ClientIP    string        `json:"client_ip"`
	Method      PaymentMethod `json:"method"`
}

// PayResponse 支付响应
type PayResponse struct {
	PayURL      string `json:"pay_url"`      // 支付链接 (跳转URL, 二维码内容, 或 HTML 表单)
	ContentType string `json:"content_type"` // "url", "qrcode", "html"
	TradeNo     string `json:"trade_no"`     // 第三方交易号 (如果立即生成)
}

// PaymentStrategy 支付接口
type PaymentStrategy interface {
	// Pay 发起支付
	Pay(req *PayRequest) (*PayResponse, error)
	// Verify 验证回调/通知 (返回 orderID, amount, error)
	Verify(params map[string]string) (string, float64, error)
}
