package config

import (
	"fmt"
	"nodepassPanel/pkg/logger"

	"github.com/spf13/viper"
)

// ServerConfig 服务配置
type ServerConfig struct {
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Driver       string `mapstructure:"driver"`
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	Username     string `mapstructure:"username"`
	Password     string `mapstructure:"password"`
	DbName       string `mapstructure:"dbname"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
}

// SMTPConfig SMTP 邮件配置
type SMTPConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	From     string `mapstructure:"from"`
	FromName string `mapstructure:"from_name"`
}

// InviteConfig 邀请返利配置
type InviteConfig struct {
	Enabled        bool    `mapstructure:"enabled"`         // 是否开启邀请
	CommissionRate float64 `mapstructure:"commission_rate"` // 返利比例 (0-1)
}

// StripeConfig Stripe 配置
type StripeConfig struct {
	Enabled    bool   `mapstructure:"enabled"`
	APIKey     string `mapstructure:"api_key"`     // Secret Key
	WebhookKey string `mapstructure:"webhook_key"` // Webhook Secret
}

// EPayConfig 易支付配置
type EPayConfig struct {
	Enabled bool   `mapstructure:"enabled"`
	URL     string `mapstructure:"url"` // 接口地址
	PID     string `mapstructure:"pid"` // 商户ID
	Key     string `mapstructure:"key"` // 商户密钥
}

// PaymentConfig 支付系统配置
type PaymentConfig struct {
	Stripe StripeConfig `mapstructure:"stripe"`
	EPay   EPayConfig   `mapstructure:"epay"`
}

type AppConfig struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Log      logger.Config  `mapstructure:"log"`
	SMTP     SMTPConfig     `mapstructure:"smtp"`
	Invite   InviteConfig   `mapstructure:"invite"`
	Payment  PaymentConfig  `mapstructure:"payment"`
}

var App AppConfig

// LoadConfig 加载配置
func LoadConfig(path string) error {
	viper.SetConfigFile(path)
	viper.SetConfigType("yaml")

	// 自动加载环境变量
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	if err := viper.Unmarshal(&App); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return nil
}
