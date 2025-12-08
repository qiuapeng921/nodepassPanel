package service

import (
	"errors"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"nodepassPanel/pkg/utils"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		userRepo: repository.NewUserRepository(),
	}
}

// RegisterRequest 注册请求参数
type RegisterRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	Code       string `json:"code"`        // 邮箱验证码（可选，由配置决定是否必须）
	InviteCode string `json:"invite_code"` // 邀请码（可选）
}

// LoginRequest 登录请求参数
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录返回
type LoginResponse struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

// Register 用户注册
func (s *AuthService) Register(req *RegisterRequest) error {
	if s.userRepo.EmailExists(req.Email) {
		return errors.New("email already registered")
	}

	// 验证码验证（如果提供了验证码）
	if req.Code != "" {
		verifyService := NewVerifyCodeService()
		if !verifyService.CheckCodeValid(req.Email, req.Code, 1) {
			return errors.New("验证码错误或已过期")
		}
		// 标记验证码为已使用
		defer verifyService.MarkCodeUsed(req.Email, req.Code, 1)
	}

	// 密码加密
	hashedPwd, err := utils.HashPassword(req.Password)
	if err != nil {
		return err
	}

	user := &model.User{
		Email:    req.Email,
		Password: hashedPwd,
		Status:   1, // 默认正常
	}

	// 创建用户
	if err := s.userRepo.Create(user); err != nil {
		return err
	}

	// 处理邀请码
	if req.InviteCode != "" {
		inviteService := NewInviteService()
		if err := inviteService.RegisterWithInviteCode(user.ID, req.InviteCode); err != nil {
			// 邀请码错误不影响注册，只是记录日志
			// logger.Log.Warn("处理邀请码失败", zap.Error(err))
		}
	}

	return nil
}

// Login 用户登录
func (s *AuthService) Login(req *LoginRequest) (*LoginResponse, error) {
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 验证密码
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		return nil, errors.New("invalid email or password")
	}

	if user.Status != 1 {
		return nil, errors.New("user is banned or inactive")
	}

	// 生成 Token
	token, err := utils.GenerateToken(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

// ResetPasswordRequest 重置密码请求参数
type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ResetPassword 重置密码（找回密码）
func (s *AuthService) ResetPassword(req *ResetPasswordRequest) error {
	// 验证邮箱是否存在
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return errors.New("该邮箱未注册")
	}

	// 验证验证码
	verifyService := NewVerifyCodeService()
	if !verifyService.CheckCodeValid(req.Email, req.Code, 2) { // 类型2=找回密码
		return errors.New("验证码错误或已过期")
	}

	// 加密新密码
	hashedPwd, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// 更新密码
	user.Password = hashedPwd
	if err := s.userRepo.Update(user); err != nil {
		return errors.New("密码重置失败")
	}

	// 标记验证码为已使用
	verifyService.MarkCodeUsed(req.Email, req.Code, 2)

	return nil
}
