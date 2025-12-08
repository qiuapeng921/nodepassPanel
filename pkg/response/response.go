package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 标准响应结构
type Response struct {
	Code int         `json:"code"` // 业务码
	Msg  string      `json:"msg"`  // 提示信息
	Data interface{} `json:"data"` // 数据
}

const (
	SuccessCode = 200
	ErrorCode   = 500
)

// Result 返回通用响应
func Result(c *gin.Context, httpCode int, code int, msg string, data interface{}) {
	c.JSON(httpCode, Response{
		Code: code,
		Msg:  msg,
		Data: data,
	})
}

// Success 处理成功请求
func Success(c *gin.Context, data interface{}) {
	Result(c, http.StatusOK, SuccessCode, "success", data)
}

// Fail 处理失败请求
func Fail(c *gin.Context, msg string) {
	Result(c, http.StatusOK, ErrorCode, msg, nil)
}

// FailWithCode 处理带错误码的失败请求
func FailWithCode(c *gin.Context, code int, msg string) {
	Result(c, http.StatusOK, code, msg, nil)
}

// Error 返回带 HTTP 状态码的错误响应
func Error(c *gin.Context, httpCode int, msg string) {
	Result(c, httpCode, httpCode, msg, nil)
}
