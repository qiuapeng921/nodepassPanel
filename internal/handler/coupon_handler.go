package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CouponHandler struct {
	couponService *service.CouponService
}

func NewCouponHandler() *CouponHandler {
	return &CouponHandler{
		couponService: service.NewCouponService(),
	}
}

// GetList 获取优惠券列表
// @Summary 获取优惠券列表
// @Tags Admin-Coupon
// @Accept json
// @Produce json
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Param search query string false "搜索关键词"
// @Success 200 {object} response.Response
// @Router /admin/coupons [get]
func (h *CouponHandler) GetList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	list, total, err := h.couponService.GetList(page, pageSize, search)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"list":      list,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Create 创建优惠券
// @Summary 创建优惠券
// @Tags Admin-Coupon
// @Accept json
// @Produce json
// @Param request body service.CreateCouponRequest true "优惠券信息"
// @Success 200 {object} response.Response
// @Router /admin/coupons [post]
func (h *CouponHandler) Create(c *gin.Context) {
	var req service.CreateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.couponService.Create(&req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Update 更新优惠券
// @Summary 更新优惠券
// @Tags Admin-Coupon
// @Accept json
// @Produce json
// @Param id path int true "ID"
// @Param request body service.UpdateCouponRequest true "优惠券信息"
// @Success 200 {object} response.Response
// @Router /admin/coupons/{id} [put]
func (h *CouponHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid id")
		return
	}

	var req service.UpdateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.couponService.Update(id, &req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Delete 删除优惠券
// @Summary 删除优惠券
// @Tags Admin-Coupon
// @Accept json
// @Produce json
// @Param id path int true "ID"
// @Success 200 {object} response.Response
// @Router /admin/coupons/{id} [delete]
func (h *CouponHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.couponService.Delete(id); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

type VerifyCouponRequest struct {
	Code   string  `json:"code" binding:"required"`
	PlanID uint    `json:"plan_id" binding:"required"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// Verify 验证优惠券
// @Summary 验证优惠券
// @Tags User-Coupon
// @Accept json
// @Produce json
// @Param request body VerifyCouponRequest true "验证信息"
// @Success 200 {object} response.Response
// @Router /user/coupons/verify [post]
func (h *CouponHandler) Verify(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req VerifyCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	coupon, discount, err := h.couponService.VerifyCoupon(req.Code, userID, req.PlanID, req.Amount)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"valid":        true,
		"discount":     discount,
		"final_amount": req.Amount - discount,
		"coupon":       coupon,
	})
}
