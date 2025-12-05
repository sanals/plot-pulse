# Use Amazon Corretto - alternative to Eclipse Temurin
# Less prone to Docker Hub CDN issues
FROM amazoncorretto:17-alpine AS build
WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

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

# Use Amazon Corretto for runtime
FROM amazoncorretto:17-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8091
ENTRYPOINT ["java", "-jar", "app.jar"] 