FROM maven:3.9.6-eclipse-temurin-17 AS build
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

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8091

# JVM Memory Configuration for Railway
# Railway free tier typically provides 512MB RAM
# We allocate 80% to heap, leaving 20% for JVM overhead and OS
# -Xmx: Maximum heap size (384MB = ~80% of 512MB)
# -Xms: Initial heap size (256MB for faster startup)
# -XX:+UseContainerSupport: Respect container memory limits
# -XX:MaxRAMPercentage: Use 75% of available container memory
# -XX:+ExitOnOutOfMemoryError: Exit immediately on OOM (better than hanging)
# -XX:+HeapDumpOnOutOfMemoryError: Generate heap dump for debugging
# -XX:HeapDumpPath: Where to save heap dumps
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
