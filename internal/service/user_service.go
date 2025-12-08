package service

import (
	"errors"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"nodepassPanel/pkg/utils"
	"time"
)

// UserService 用户服务层
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService 创建用户服务实例
func NewUserService() *UserService {
	return &UserService{
		userRepo: repository.NewUserRepository(),
	}
}

// ==================== 请求/响应结构 ====================

// UserProfileResponse 用户个人信息响应
type UserProfileResponse struct {
	ID             uint       `json:"id"`
	UUID           string     `json:"uuid"`
	Email          string     `json:"email"`
	Balance        float64    `json:"balance"`
	Commission     float64    `json:"commission"`
	Upload         int64      `json:"upload"`
	Download       int64      `json:"download"`
	TransferEnable int64      `json:"transfer_enable"`
	Status         int        `json:"status"`
	IsAdmin        bool       `json:"is_admin"`
	GroupID        int        `json:"group_id"`
	ExpiredAt      *time.Time `json:"expired_at"`
	InviteCode     string     `json:"invite_code"`
	InvitedCount   int64      `json:"invited_count"`
	LastLoginAt    *time.Time `json:"last_login_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// UpdateProfileRequest 更新个人信息请求
type UpdateProfileRequest struct {
	// 用户只能修改有限的信息
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// AdminUpdateUserRequest 管理员更新用户请求
type AdminUpdateUserRequest struct {
	Email          *string    `json:"email"`
	Password       *string    `json:"password"`
	Balance        *float64   `json:"balance"`
	Commission     *float64   `json:"commission"`
	Upload         *int64     `json:"upload"`
	Download       *int64     `json:"download"`
	TransferEnable *int64     `json:"transfer_enable"`
	Status         *int       `json:"status"`
	IsAdmin        *bool      `json:"is_admin"`
	GroupID        *int       `json:"group_id"`
	ExpiredAt      *time.Time `json:"expired_at"`
}

// UserListQuery 用户列表查询参数
type UserListQuery struct {
	Page     int    `form:"page" binding:"omitempty,min=1"`
	PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Search   string `form:"search"`
}

// UserListResponse 用户列表响应
type UserListResponse struct {
	List     []model.User `json:"list"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

// ==================== 用户端方法 ====================

// GetProfile 获取当前用户个人信息
func (s *UserService) GetProfile(userID uint) (*UserProfileResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	invitedCount := s.userRepo.CountByInviter(userID)

	return &UserProfileResponse{
		ID:             user.ID,
		UUID:           user.UUID,
		Email:          user.Email,
		Balance:        user.Balance,
		Commission:     user.Commission,
		Upload:         user.Upload,
		Download:       user.Download,
		TransferEnable: user.TransferEnable,
		Status:         user.Status,
		IsAdmin:        user.IsAdmin,
		GroupID:        user.GroupID,
		ExpiredAt:      user.ExpiredAt,
		InviteCode:     user.InviteCode,
		InvitedCount:   invitedCount,
		LastLoginAt:    user.LastLoginAt,
		CreatedAt:      user.CreatedAt,
	}, nil
}

// ChangePassword 修改密码
func (s *UserService) ChangePassword(userID uint, req *ChangePasswordRequest) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// 验证旧密码
	if !utils.CheckPasswordHash(req.OldPassword, user.Password) {
		return errors.New("invalid old password")
	}

	// 加密新密码
	hashedPwd, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.Password = hashedPwd
	return s.userRepo.Update(user)
}

// GetTrafficStats 获取流量统计
func (s *UserService) GetTrafficStats(userID uint) (map[string]interface{}, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	used := user.Upload + user.Download
	remaining := user.TransferEnable - used
	if remaining < 0 {
		remaining = 0
	}

	usagePercent := float64(0)
	if user.TransferEnable > 0 {
		usagePercent = float64(used) / float64(user.TransferEnable) * 100
	}

	return map[string]interface{}{
		"upload":        user.Upload,
		"download":      user.Download,
		"used":          used,
		"total":         user.TransferEnable,
		"remaining":     remaining,
		"usage_percent": usagePercent,
		"expired_at":    user.ExpiredAt,
	}, nil
}

// ResetSubscribeToken 重置订阅令牌 (UUID)
func (s *UserService) ResetSubscribeToken(userID uint) (string, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return "", errors.New("user not found")
	}

	// 生成新 UUID
	user.UUID = utils.GenerateUUID()

	if err := s.userRepo.Update(user); err != nil {
		return "", err
	}

	return user.UUID, nil
}

// ==================== 管理员方法 ====================

// GetUserList 获取用户列表（分页）
func (s *UserService) GetUserList(query *UserListQuery) (*UserListResponse, error) {
	// 默认值
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 {
		query.PageSize = 20
	}

	users, total, err := s.userRepo.GetPaginated(query.Page, query.PageSize, query.Search)
	if err != nil {
		return nil, err
	}

	return &UserListResponse{
		List:     users,
		Total:    total,
		Page:     query.Page,
		PageSize: query.PageSize,
	}, nil
}

// GetUserByID 根据ID获取用户（管理员）
func (s *UserService) GetUserByID(id uint) (*model.User, error) {
	return s.userRepo.GetByID(id)
}

// UpdateUser 更新用户（管理员）
func (s *UserService) UpdateUser(id uint, req *AdminUpdateUserRequest) (*model.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// 更新非空字段
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Password != nil {
		hashedPwd, err := utils.HashPassword(*req.Password)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.Password = hashedPwd
	}
	if req.Balance != nil {
		user.Balance = *req.Balance
	}
	if req.Commission != nil {
		user.Commission = *req.Commission
	}
	if req.Upload != nil {
		user.Upload = *req.Upload
	}
	if req.Download != nil {
		user.Download = *req.Download
	}
	if req.TransferEnable != nil {
		user.TransferEnable = *req.TransferEnable
	}
	if req.Status != nil {
		user.Status = *req.Status
	}
	if req.IsAdmin != nil {
		user.IsAdmin = *req.IsAdmin
	}
	if req.GroupID != nil {
		user.GroupID = *req.GroupID
	}
	if req.ExpiredAt != nil {
		user.ExpiredAt = req.ExpiredAt
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

// DeleteUser 删除用户（管理员）
func (s *UserService) DeleteUser(id uint) error {
	_, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}

// ResetTraffic 重置用户流量（管理员）
func (s *UserService) ResetTraffic(id uint) error {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	user.Upload = 0
	user.Download = 0

	return s.userRepo.Update(user)
}

// ChargeUser 给用户充值（管理员）
func (s *UserService) ChargeUser(id uint, amount float64) error {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	user.Balance += amount

	return s.userRepo.Update(user)
}

// BanUser 禁用用户（管理员）
func (s *UserService) BanUser(id uint) error {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	user.Status = 0

	return s.userRepo.Update(user)
}

// UnbanUser 启用用户（管理员）
func (s *UserService) UnbanUser(id uint) error {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	user.Status = 1

	return s.userRepo.Update(user)
}

// ==================== 批量操作 ====================

// UserBatchRequest 用户批量操作请求
type UserBatchRequest struct {
	IDs []uint `json:"ids" binding:"required,min=1"`
}

// UserBatchChargeRequest 用户批量充值请求
type UserBatchChargeRequest struct {
	IDs    []uint  `json:"ids" binding:"required,min=1"`
	Amount float64 `json:"amount" binding:"required"`
}

// BatchUpdateStatus 批量更新用户状态
func (s *UserService) BatchUpdateStatus(ids []uint, status int) (int64, error) {
	count, err := s.userRepo.BatchUpdateStatus(ids, status)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// BatchCharge 批量充值
func (s *UserService) BatchCharge(ids []uint, amount float64) (int64, error) {
	count, err := s.userRepo.BatchAddBalance(ids, amount)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// BatchDelete 批量删除用户
func (s *UserService) BatchDelete(ids []uint) (int64, error) {
	count, err := s.userRepo.BatchDelete(ids)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// BatchResetTraffic 批量重置流量
func (s *UserService) BatchResetTraffic(ids []uint) (int64, error) {
	count, err := s.userRepo.BatchResetTraffic(ids)
	if err != nil {
		return 0, err
	}
	return count, nil
}
