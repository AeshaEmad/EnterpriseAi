FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY EnterpriseAI/EnterpriseAI/EnterpriseAI.csproj ./EnterpriseAI/EnterpriseAI/
RUN dotnet restore ./EnterpriseAI/EnterpriseAI/EnterpriseAI.csproj

# Copy the rest of the backend source code
COPY EnterpriseAI/ ./EnterpriseAI/
WORKDIR /src/EnterpriseAI/EnterpriseAI
RUN dotnet publish EnterpriseAI.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["dotnet", "EnterpriseAI.dll"]
