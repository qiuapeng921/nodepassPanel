package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
)

// OrderRepository 订单数据访问层
type OrderRepository struct{}

// NewOrderRepository 创建订单仓库实例
func NewOrderRepository() *OrderRepository {
	return &OrderRepository{}
}

// Create 创建订单
func (r *OrderRepository) Create(order *model.Order) error {
	return global.DB.Create(order).Error
}

// GetByID 根据ID获取订单
func (r *OrderRepository) GetByID(id uint) (*model.Order, error) {
	var order model.Order
	err := global.DB.First(&order, id).Error
	return &order, err
}

// GetByOrderNo 根据订单号获取订单
func (r *OrderRepository) GetByOrderNo(orderNo string) (*model.Order, error) {
	var order model.Order
	err := global.DB.Where("order_no = ?", orderNo).First(&order).Error
	return &order, err
}

// GetByUserID 获取用户的订单
func (r *OrderRepository) GetByUserID(userID uint) ([]model.Order, error) {
	var orders []model.Order
	err := global.DB.Where("user_id = ?", userID).Order("id DESC").Find(&orders).Error
	return orders, err
}

// GetAll 获取所有订单
func (r *OrderRepository) GetAll() ([]model.Order, error) {
	var orders []model.Order
	err := global.DB.Order("id DESC").Find(&orders).Error
	return orders, err
}

// GetPaginated 分页获取订单
func (r *OrderRepository) GetPaginated(page, pageSize int, status *int, userID *uint) ([]model.Order, int64, error) {
	var orders []model.Order
	var total int64

	query := global.DB.Model(&model.Order{})

	if status != nil {
		query = query.Where("status = ?", *status)
	}
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&orders).Error; err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

// Update 更新订单
func (r *OrderRepository) Update(order *model.Order) error {
	return global.DB.Save(order).Error
}

// Delete 删除订单
func (r *OrderRepository) Delete(id uint) error {
	return global.DB.Delete(&model.Order{}, id).Error
}

// CountUsageByUser 统计用户使用特定优惠券的次数（仅限已支付订单）
func (r *OrderRepository) CountUsageByUser(userID uint, couponID int) (int64, error) {
	var count int64
	err := global.DB.Model(&model.Order{}).
		Where("user_id = ? AND coupon_id = ? AND status = ?", userID, couponID, model.OrderStatusPaid).
		Count(&count).Error
	return count, err
}
