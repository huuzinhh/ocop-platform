$ErrorActionPreference = "Stop"
[System.Environment]::SetEnvironmentVariable('PGPASSWORD', '123456')

Write-Host "1. Checking if ocop_db exists..."
$dbCheck = psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='ocop_db';"
if ([string]::IsNullOrWhiteSpace($dbCheck) -or $dbCheck.Trim() -ne '1') {
    Write-Host "Creating database ocop_db..."
    psql -U postgres -h localhost -c "CREATE DATABASE ocop_db WITH OWNER postgres ENCODING 'UTF8';"
    Write-Host "Database ocop_db created successfully!"
} else {
    Write-Host "Database ocop_db already exists."
}

Write-Host "2. Applying schema.sql to ocop_db..."
psql -U postgres -h localhost -d ocop_db -f "D:\Đồ án tốt nghiệp\backend\src\main\resources\schema.sql"

Write-Host "3. Applying data.sql to ocop_db..."
psql -U postgres -h localhost -d ocop_db -f "D:\Đồ án tốt nghiệp\backend\src\main\resources\data.sql"

Write-Host "4. Verifying tables and row counts in ocop_db..."
psql -U postgres -h localhost -d ocop_db -c "
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
SELECT count(*) AS total_products FROM products;
SELECT count(*) AS total_producers FROM producers;
SELECT count(*) AS total_batches FROM production_batches;
"
Write-Host "POSTGRES_SETUP_COMPLETE"
