package handler

import (
	"nodepassPanel/internal/payment"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"

	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	orderService *service.OrderService
}

func NewPaymentHandler() *PaymentHandler {
	return &PaymentHandler{
		orderService: service.NewOrderService(),
	}
}

// Pay 发起支付
func (h *PaymentHandler) Pay(c *gin.Context) {
	var req struct {
		OrderNo string                `json:"order_no" binding:"required"`
		Method  payment.PaymentMethod `json:"method" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, "参数无效")
		return
	}

	resp, err := h.orderService.PayOrder(req.OrderNo, req.Method, c.ClientIP())
	if err != nil {
		response.Fail(c, "支付失败: "+err.Error())
		return
	}

	response.Success(c, resp)
}

// Notify 支付回调
func (h *PaymentHandler) Notify(c *gin.Context) {
	method := c.Param("method")

	// 收集参数
	// 不同网关参数传递方式不同 (Query, PostForm, JSON Body)
	// 通用参数收集
	params := make(map[string]string)

	if c.Request.Method == "GET" {
		for k, v := range c.Request.URL.Query() {
			if len(v) > 0 {
				params[k] = v[0]
			}
		}
	} else {
		// Form
		c.Request.ParseForm()
		for k, v := range c.Request.PostForm {
			if len(v) > 0 {
				params[k] = v[0]
			}
		}

		// Stripe Body
		if method == string(payment.MethodStripe) {
			body, _ := c.GetRawData()
			params["payload"] = string(body) // Payload 用于验签
			params["sig_header"] = c.GetHeader("Stripe-Signature")
		}
	}

	err := h.orderService.HandlePaymentNotify(payment.PaymentMethod(method), params)
	if err != nil {
		c.String(400, "fail: "+err.Error())
		return
	}

	c.String(200, "success")
}
