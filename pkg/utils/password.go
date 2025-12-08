package utils

import (
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword 生成密码哈希
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash 验证密码
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateUUID 生成新的 UUID
func GenerateUUID() string {
	return uuid.NewString()
}
