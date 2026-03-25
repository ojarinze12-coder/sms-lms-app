-- Update admin password with proper bcrypt hash
UPDATE users 
SET password = '$2a$10$vXEWZ.CaKE84JymDpQp6UebhFoMv1QBKRY1yw/RDu8vAA2E/N1x4G'
WHERE email = 'admin@demo-school.com';

SELECT email, password FROM users WHERE email = 'admin@demo-school.com';
