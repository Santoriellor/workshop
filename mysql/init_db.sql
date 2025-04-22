-- Grant permissions on the test database to django_user
GRANT ALL PRIVILEGES ON `test_%`.* TO 'django_user'@'%';
FLUSH PRIVILEGES;
