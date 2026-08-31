Campus Errand Platform
A campus errand service platform built with Spring Boot.
Main Features
- User registration and login
- Create and manage errand orders
- Accept and deliver orders
- Points rewards and payments
- Order reviews and appeals
- User and order management

Tech Stack
- Java 17
- Spring Boot
- MyBatis
- MySQL
- HTML, CSS, and JavaScript
- Maven

Database Configuration
1. Open MySQL and create a database named testdb:
CREATE DATABASE testdb
CHARACTER SET utf8mb4;
2. Import the database file provided in the project into testdb:
database/testdb.sql
You can import it using the MySQL command line:
mysql -u root -p testdb < database/testdb.sql
3. Open the following configuration file:
src/main/resources/application.yaml
4. Update the database connection details according to your local MySQL configuration:
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/testdb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
