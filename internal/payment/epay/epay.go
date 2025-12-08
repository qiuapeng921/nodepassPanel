package epay

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/url"
	"sort"
	"strings"

	"nodepassPanel/internal/config"
	"nodepassPanel/internal/payment"
)

type EPay struct {
	Config config.EPayConfig
}

func NewEPay(cfg config.EPayConfig) *EPay {
	return &EPay{Config: cfg}
}

func (e *EPay) Pay(req *payment.PayRequest) (*payment.PayResponse, error) {
	if !e.Config.Enabled {
		return nil, fmt.Errorf("epay 未启用")
	}

	// 构造参数
	params := map[string]string{
		"pid":          e.Config.PID,
		"type":         string(req.Method), // alipay, wxpay
		"out_trade_no": req.OrderID,
		"notify_url":   "http://YOUR_DOMAIN/api/v1/payment/notify/epay", // TODO: Configurable Domain
		"return_url":   "http://YOUR_DOMAIN/user/orders",                // TODO: Frontend Return URL
		"name":         req.Description,
		"money":        fmt.Sprintf("%.2f", req.Amount),
		"clientip":     req.ClientIP,
	}

	// 签名
	sign := e.Sign(params)
	params["sign"] = sign
	params["sign_type"] = "MD5"

	// 构造跳转URL
	query := url.Values{}
	for k, v := range params {
		query.Set(k, v)
	}
	payURL := fmt.Sprintf("%ssubmit.php?%s", e.Config.URL, query.Encode())

	return &payment.PayResponse{
		PayURL:      payURL,
		ContentType: "url", // EPay 通常跳转到收银台
	}, nil
}

func (e *EPay) Verify(params map[string]string) (string, float64, error) {
	// 验证签名
	sign := params["sign"]
	if sign == "" {
		return "", 0, fmt.Errorf("no sign")
	}

	// 移除sign和sign_type用于计算
	verifyParams := make(map[string]string)
	for k, v := range params {
		if k != "sign" && k != "sign_type" && v != "" {
			verifyParams[k] = v
		}
	}

	calculatedSign := e.Sign(verifyParams)
	if calculatedSign != sign {
		return "", 0, fmt.Errorf("invalid sign")
	}

	// 验证状态
	if params["trade_status"] != "TRADE_SUCCESS" {
		return "", 0, fmt.Errorf("交易失败")
	}

	orderID := params["out_trade_no"]
	// money := params["money"] // 解析金额...
	// EPay 回调可能不携带精确的浮点数，但我们信任 OrderID。
	// 为了 MVP，仅返回 OrderID。
	return orderID, 0, nil
}

func (e *EPay) Sign(params map[string]string) string {
	var keys []string
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var builder strings.Builder
	for i, k := range keys {
		if i > 0 {
			builder.WriteString("&")
		}
		builder.WriteString(k)
		builder.WriteString("=")
		builder.WriteString(params[k])
	}
	// append key
	builder.WriteString(e.Config.Key)

	// md5
	hash := md5.Sum([]byte(builder.String()))
	return hex.EncodeToString(hash[:])
}
