package service

import (
	"errors"
	"math/rand"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"strconv"
	"strings"
	"time"
)

type CreateCouponRequest struct {
	Code         string  `json:"code"`
	Type         int     `json:"type" binding:"required,oneof=1 2 3"`
	Value        float64 `json:"value" binding:"required"`
	MinAmount    float64 `json:"min_amount"`
	MaxDiscount  float64 `json:"max_discount"`
	LimitPerUser int     `json:"limit_per_user"`
	TotalLimit   int     `json:"total_limit"`
	PlanIDs      string  `json:"plan_ids"`
	StartAt      int64   `json:"start_at"`   // Unix timestamp
	ExpiredAt    int64   `json:"expired_at"` // Unix timestamp
	Status       int     `json:"status" binding:"oneof=0 1"`
}

type UpdateCouponRequest struct {
	Code         string  `json:"code"`
	Type         int     `json:"type" binding:"oneof=1 2 3"`
	Value        float64 `json:"value"`
	MinAmount    float64 `json:"min_amount"`
	MaxDiscount  float64 `json:"max_discount"`
	LimitPerUser int     `json:"limit_per_user"`
	TotalLimit   int     `json:"total_limit"`
	PlanIDs      string  `json:"plan_ids"`
	StartAt      int64   `json:"start_at"`
	ExpiredAt    int64   `json:"expired_at"`
	Status       int     `json:"status" binding:"oneof=0 1"`
}

type CouponService struct {
	couponRepo repository.CouponRepo
	orderRepo  *repository.OrderRepository
}

func NewCouponService() *CouponService {
	return &CouponService{
		couponRepo: repository.NewCouponRepo(),
		orderRepo:  repository.NewOrderRepository(),
	}
}

func (s *CouponService) Create(req *CreateCouponRequest) error {
	if req.Code == "" {
		req.Code = s.GenerateCode()
	}

	exists, _ := s.couponRepo.FindByCode(req.Code)
	if exists != nil {
		return errors.New("优惠券码已存在")
	}

	coupon := &model.Coupon{
		Code:         req.Code,
		Type:         req.Type,
		Value:        req.Value,
		MinAmount:    req.MinAmount,
		MaxDiscount:  req.MaxDiscount,
		LimitPerUser: req.LimitPerUser,
		TotalLimit:   req.TotalLimit,
		PlanIDs:      req.PlanIDs,
		Status:       req.Status,
	}

	if req.StartAt > 0 {
		t := time.Unix(req.StartAt, 0)
		coupon.StartAt = &t
	}
	if req.ExpiredAt > 0 {
		t := time.Unix(req.ExpiredAt, 0)
		coupon.ExpiredAt = &t
	}

	return s.couponRepo.Create(coupon)
}

func (s *CouponService) Update(id int, req *UpdateCouponRequest) error {
	coupon, err := s.couponRepo.FindByID(id)
	if err != nil {
		return err
	}
	if coupon == nil {
		return errors.New("优惠券不存在")
	}

	if req.Code != "" && req.Code != coupon.Code {
		exists, _ := s.couponRepo.FindByCode(req.Code)
		if exists != nil {
			return errors.New("优惠券码已存在")
		}
		coupon.Code = req.Code
	}

	if req.Type != 0 {
		coupon.Type = req.Type
	}
	coupon.Value = req.Value
	coupon.MinAmount = req.MinAmount
	coupon.MaxDiscount = req.MaxDiscount
	coupon.LimitPerUser = req.LimitPerUser
	coupon.TotalLimit = req.TotalLimit
	coupon.PlanIDs = req.PlanIDs
	coupon.Status = req.Status

	if req.StartAt > 0 {
		t := time.Unix(req.StartAt, 0)
		coupon.StartAt = &t
	} else {
		coupon.StartAt = nil
	}

	if req.ExpiredAt > 0 {
		t := time.Unix(req.ExpiredAt, 0)
		coupon.ExpiredAt = &t
	} else {
		coupon.ExpiredAt = nil
	}

	return s.couponRepo.Update(coupon)
}

func (s *CouponService) Delete(id int) error {
	return s.couponRepo.Delete(id)
}

func (s *CouponService) GetList(page, pageSize int, search string) ([]*model.Coupon, int64, error) {
	return s.couponRepo.List(page, pageSize, search)
}

func (s *CouponService) GenerateCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 12)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// VerifyCoupon 验证优惠券并计算折扣
func (s *CouponService) VerifyCoupon(code string, userID uint, planID uint, amount float64) (*model.Coupon, float64, error) {
	// 1. 查找优惠券
	coupon, err := s.couponRepo.FindByCode(code)
	if err != nil {
		return nil, 0, err
	}
	if coupon == nil {
		return nil, 0, errors.New("优惠券不存在")
	}

	// 2. 检查状态
	if coupon.Status == 0 {
		return nil, 0, errors.New("优惠券已禁用")
	}

	// 3. 检查有效期
	now := time.Now()
	if coupon.StartAt != nil && now.Before(*coupon.StartAt) {
		return nil, 0, errors.New("优惠券未生效")
	}
	if coupon.ExpiredAt != nil && now.After(*coupon.ExpiredAt) {
		return nil, 0, errors.New("优惠券已过期")
	}

	// 4. 检查总使用限制
	if coupon.TotalLimit > 0 && coupon.UsedCount >= coupon.TotalLimit {
		return nil, 0, errors.New("优惠券已领完")
	}

	// 5. 检查用户使用限制
	if coupon.LimitPerUser > 0 {
		count, err := s.orderRepo.CountUsageByUser(userID, int(coupon.ID))
		if err != nil {
			return nil, 0, err
		}
		if int(count) >= coupon.LimitPerUser {
			return nil, 0, errors.New("您已达到使用限制")
		}
	}

	// 6. 检查套餐适用性
	if coupon.PlanIDs != "" {
		planIDs := strings.Split(coupon.PlanIDs, ",")
		found := false
		for _, idStr := range planIDs {
			idStr = strings.TrimSpace(idStr)
			if idStr == "" {
				continue
			}
			id, _ := strconv.Atoi(idStr)
			if uint(id) == planID {
				found = true
				break
			}
		}
		if !found {
			return nil, 0, errors.New("该套餐不可使用此优惠券")
		}
	}

	// 7. 检查最低消费
	if amount < coupon.MinAmount {
		return nil, 0, errors.New("未达到最低消费金额")
	}

	// 8. 计算折扣
	discount := 0.0
	if coupon.Type == model.CouponTypeFixedAmount {
		discount = coupon.Value
	} else if coupon.Type == model.CouponTypePercentage {
		discount = amount * (coupon.Value / 100)
		if coupon.MaxDiscount > 0 && discount > coupon.MaxDiscount {
			discount = coupon.MaxDiscount
		}
	}
	// Type 3 (赠送天数) 不计算价格折扣

	if discount > amount {
		discount = amount
	}

	return coupon, discount, nil
}

// IncrementUsage 增加优惠券使用次数
func (s *CouponService) IncrementUsage(id int) error {
	return s.couponRepo.IncrementUsedCount(id)
}
