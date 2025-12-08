package stripe

import (
	"encoding/json"
	"fmt"
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/payment"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

type StripePay struct {
	Config config.StripeConfig
}

func NewStripePay(cfg config.StripeConfig) *StripePay {
	stripe.Key = cfg.APIKey // 设置全局 Key
	return &StripePay{Config: cfg}
}

func (s *StripePay) Pay(req *payment.PayRequest) (*payment.PayResponse, error) {
	if !s.Config.Enabled {
		return nil, fmt.Errorf("stripe 未启用")
	}

	stripe.Key = s.Config.APIKey // 确保 Key 已设置

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("cny"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String(req.Description),
					},
					UnitAmount: stripe.Int64(int64(req.Amount * 100)), // cents
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:              stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:        stripe.String("http://YOUR_DOMAIN/user/orders?status=success"),
		CancelURL:         stripe.String("http://YOUR_DOMAIN/user/orders?status=cancel"),
		ClientReferenceID: stripe.String(req.OrderID),
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, err
	}

	return &payment.PayResponse{
		PayURL:      sess.URL,
		ContentType: "url",
		TradeNo:     sess.ID,
	}, nil
}

func (s *StripePay) Verify(params map[string]string) (string, float64, error) {
	payload := params["payload"]
	sigHeader := params["sig_header"]

	event, err := webhook.ConstructEvent([]byte(payload), sigHeader, s.Config.WebhookKey)
	if err != nil {
		return "", 0, err
	}

	if event.Type == "checkout.session.completed" {
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			return "", 0, err
		}
		// Stripe 金额单位为分 (int64)
		return session.ClientReferenceID, float64(session.AmountTotal) / 100.0, nil
	}

	return "", 0, fmt.Errorf("忽略的事件类型: %s", event.Type)
}
