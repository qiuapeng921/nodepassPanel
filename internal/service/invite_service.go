package service

import (
	"errors"
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"

	"gorm.io/gorm"
)

// InviteService 邀请服务
type InviteService struct{}

// NewInviteService 创建邀请服务实例
func NewInviteService() *InviteService {
	return &InviteService{}
}

// GetInviteInfo 获取邀请信息
type InviteInfo struct {
	InviteCode        string  `json:"invite_code"`
	InviteLink        string  `json:"invite_link"`
	InviteCount       int64   `json:"invite_count"`
	TotalCommission   float64 `json:"total_commission"`
	PendingCommission float64 `json:"pending_commission"`
}

// GetInviteInfo 获取用户邀请信息
func (s *InviteService) GetInviteInfo(userID uint, baseURL string) (*InviteInfo, error) {
	var user model.User
	if err := global.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	// 统计邀请人数
	var inviteCount int64
	global.DB.Model(&model.InviteRecord{}).Where("inviter_id = ?", userID).Count(&inviteCount)

	// 统计总返利
	var totalCommission float64
	global.DB.Model(&model.InviteRecord{}).
		Where("inviter_id = ?", userID).
		Select("COALESCE(SUM(commission), 0)").
		Scan(&totalCommission)

	// 统计待结算返利
	var pendingCommission float64
	global.DB.Model(&model.InviteRecord{}).
		Where("inviter_id = ? AND status = ?", userID, model.InviteRecordStatusPending).
		Select("COALESCE(SUM(commission), 0)").
		Scan(&pendingCommission)

	return &InviteInfo{
		InviteCode:        user.InviteCode,
		InviteLink:        baseURL + "/register?code=" + user.InviteCode,
		InviteCount:       inviteCount,
		TotalCommission:   totalCommission,
		PendingCommission: pendingCommission,
	}, nil
}

// GetInviteRecords 获取邀请记录
func (s *InviteService) GetInviteRecords(userID uint, page, pageSize int) ([]map[string]interface{}, int64, error) {
	var total int64
	global.DB.Model(&model.InviteRecord{}).Where("inviter_id = ?", userID).Count(&total)

	var records []model.InviteRecord
	if err := global.DB.Where("inviter_id = ?", userID).
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	// 获取被邀请人信息
	result := make([]map[string]interface{}, 0, len(records))
	for _, record := range records {
		var invitee model.User
		global.DB.Select("email", "created_at").First(&invitee, record.InviteeID)

		result = append(result, map[string]interface{}{
			"id":         record.ID,
			"email":      s.maskEmail(invitee.Email),
			"commission": record.Commission,
			"status":     record.Status,
			"created_at": record.CreatedAt,
		})
	}

	return result, total, nil
}

// ProcessInviteCommission 处理邀请返利（当被邀请人首次付费时调用）
func (s *InviteService) ProcessInviteCommission(inviteeID uint, orderAmount float64, orderID uint) error {
	// 检查是否开启邀请返利
	if !config.App.Invite.Enabled {
		return nil
	}

	// 查找被邀请人的邀请者
	var user model.User
	if err := global.DB.First(&user, inviteeID).Error; err != nil {
		return nil
	}

	if user.InvitedBy == 0 {
		return nil // 没有邀请者
	}

	// 检查是否已有邀请记录（避免重复计算）
	var existingRecord model.InviteRecord
	if err := global.DB.Where("invitee_id = ?", inviteeID).First(&existingRecord).Error; err == nil {
		// 已存在记录，更新订单ID
		if existingRecord.OrderID == 0 {
			existingRecord.OrderID = orderID
			existingRecord.Commission = orderAmount * config.App.Invite.CommissionRate
			existingRecord.Status = model.InviteRecordStatusSettled
			global.DB.Save(&existingRecord)

			// 给邀请者增加佣金
			s.addCommission(user.InvitedBy, existingRecord.Commission)
		}
		return nil
	}

	// 创建邀请记录
	commission := orderAmount * config.App.Invite.CommissionRate
	record := &model.InviteRecord{
		InviterID:  user.InvitedBy,
		InviteeID:  inviteeID,
		Commission: commission,
		OrderID:    orderID,
		Status:     model.InviteRecordStatusSettled,
	}

	if err := global.DB.Create(record).Error; err != nil {
		return err
	}

	// 给邀请者增加佣金
	s.addCommission(user.InvitedBy, commission)

	return nil
}

// RegisterWithInviteCode 处理使用邀请码注册
func (s *InviteService) RegisterWithInviteCode(inviteeID uint, inviteCode string) error {
	if inviteCode == "" {
		return nil
	}

	// 查找邀请者
	var inviter model.User
	if err := global.DB.Where("invite_code = ?", inviteCode).First(&inviter).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("邀请码无效")
		}
		return err
	}

	// 不能自己邀请自己
	if inviter.ID == inviteeID {
		return errors.New("不能使用自己的邀请码")
	}

	// 更新被邀请人的邀请者ID
	if err := global.DB.Model(&model.User{}).Where("id = ?", inviteeID).
		Update("invited_by", inviter.ID).Error; err != nil {
		return err
	}

	// 创建邀请记录（待结算）
	record := &model.InviteRecord{
		InviterID:  inviter.ID,
		InviteeID:  inviteeID,
		Commission: 0,
		Status:     model.InviteRecordStatusPending,
	}
	global.DB.Create(record)

	return nil
}

// addCommission 给用户增加佣金
func (s *InviteService) addCommission(userID uint, amount float64) {
	global.DB.Model(&model.User{}).Where("id = ?", userID).
		Update("commission", gorm.Expr("commission + ?", amount))
}

// maskEmail 隐藏邮箱中间部分
func (s *InviteService) maskEmail(email string) string {
	if len(email) < 5 {
		return email
	}
	atIndex := -1
	for i, c := range email {
		if c == '@' {
			atIndex = i
			break
		}
	}
	if atIndex <= 2 {
		return email
	}
	return email[:2] + "***" + email[atIndex:]
}
