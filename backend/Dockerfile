# Use pinned version tags for better caching and stability
# These specific versions are more likely to be cached by Railway
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY backend/pom.xml ./pom.xml
# This step will cache the dependencies unless pom.xml changes
RUN mvn dependency:go-offline

# Copy source code
COPY backend/src/ ./src/
# Skip tests during Docker build (no database available)
# Tests should be run locally or in CI/CD pipeline
# Using maven.test.skip to skip both compilation and execution of tests
RUN mvn clean package -Dmaven.test.skip=true

# Use pinned JRE version - more likely to be cached
FROM eclipse-temurin:17.0.13_11-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8091
ENTRYPOINT ["java", "-jar", "app.jar"] 