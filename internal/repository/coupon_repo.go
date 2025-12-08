package repository

import (
	"errors"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"

	"gorm.io/gorm"
)

type CouponRepo interface {
	Create(coupon *model.Coupon) error
	Update(coupon *model.Coupon) error
	Delete(id int) error
	FindByID(id int) (*model.Coupon, error)
	FindByCode(code string) (*model.Coupon, error)
	List(page, pageSize int, search string) ([]*model.Coupon, int64, error)
	IncrementUsedCount(id int) error
}

type couponRepo struct{}

func NewCouponRepo() CouponRepo {
	return &couponRepo{}
}

func (r *couponRepo) Create(coupon *model.Coupon) error {
	return global.DB.Create(coupon).Error
}

func (r *couponRepo) Update(coupon *model.Coupon) error {
	return global.DB.Save(coupon).Error
}

func (r *couponRepo) Delete(id int) error {
	return global.DB.Delete(&model.Coupon{}, id).Error
}

func (r *couponRepo) FindByID(id int) (*model.Coupon, error) {
	var coupon model.Coupon
	err := global.DB.First(&coupon, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

func (r *couponRepo) FindByCode(code string) (*model.Coupon, error) {
	var coupon model.Coupon
	err := global.DB.Where("code = ?", code).First(&coupon).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

func (r *couponRepo) List(page, pageSize int, search string) ([]*model.Coupon, int64, error) {
	var coupons []*model.Coupon
	var total int64
	query := global.DB.Model(&model.Coupon{})

	if search != "" {
		query = query.Where("code LIKE ?", "%"+search+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Order("id desc").Limit(pageSize).Offset(offset).Find(&coupons).Error
	if err != nil {
		return nil, 0, err
	}

	return coupons, total, nil
}

func (r *couponRepo) IncrementUsedCount(id int) error {
	return global.DB.Model(&model.Coupon{}).Where("id = ?", id).UpdateColumn("used_count", gorm.Expr("used_count + ?", 1)).Error
}
