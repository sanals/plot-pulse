FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY backend/pom.xml ./pom.xml
# This step will cache the dependencies unless pom.xml changes
RUN mvn dependency:go-offline

# Copy source code
COPY backend/src/ ./src/
RUN mvn clean package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8091
ENTRYPOINT ["java", "-jar", "app.jar"] 