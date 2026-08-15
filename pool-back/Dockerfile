# ======================================================================
# Stage 1: Build & Package (Multi-stage build)
# ======================================================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# 1. Cài đặt các công cụ cần thiết cho build
RUN apk add --no-cache bash

# 2. Copy Maven wrapper & pom.xml trước để cache dependency layer
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x ./mvnw

# Tải trước dependencies & plugins (layer caching sạch, không cần || true)
RUN ./mvnw dependency:resolve dependency:resolve-plugins -B

# 3. Copy toàn bộ mã nguồn và build file JAR
COPY src src
RUN ./mvnw clean package -DskipTests -B

# ======================================================================
# Stage 2: Production Lightweight Runtime Image
# ======================================================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# 1. Tạo non-root user để tăng tính bảo mật (Security Best Practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 2. Copy file JAR (sử dụng wildcard *.jar hoặc app.jar nhờ <finalName> trong pom.xml, không hardcode version)
COPY --from=builder /app/target/*.jar app.jar

# 3. Cấp quyền sở hữu thư mục app cho appuser
RUN chown -R appuser:appgroup /app

# 4. Chuyển sang non-root user
USER appuser

# 5. Khai báo cổng mặc định (Render sẽ tự inject biến môi trường PORT)
EXPOSE 8080

# 6. Tối ưu JVM cho Container (Tự động thích ứng RAM 512MB của Render Free Tier)
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+ExitOnOutOfMemoryError \
               -Djava.security.egd=file:/dev/./urandom \
               -Dfile.encoding=UTF-8"

# 7. Khởi chạy ứng dụng
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
