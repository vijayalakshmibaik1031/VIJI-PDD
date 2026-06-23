$base = "http://127.0.0.1:5000/api"
$empId = "test_emp_$(Get-Random)"

Invoke-RestMethod "$base/../test-db" | Out-Null
Invoke-RestMethod "$base/managers/login" -Method POST -ContentType "application/json" -Body '{"userId":"manager","password":"man123"}' | Out-Null
Invoke-RestMethod "$base/authorities/login" -Method POST -ContentType "application/json" -Body '{"userId":"auth","password":"auth123"}' | Out-Null
Invoke-RestMethod "$base/employees/register" -Method POST -ContentType "application/json" -Body (@{ id = $empId; name = "Test Emp"; password = "pass1" } | ConvertTo-Json) | Out-Null
$loginRes = Invoke-RestMethod "$base/employees/login" -Method POST -ContentType "application/json" -Body (@{ userId = $empId; password = "pass1" } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($loginRes.token)" }
$emps = Invoke-RestMethod "$base/employees" -Headers $headers
if ($emps.id -notcontains $empId) { throw "Employee not in DB" }
Write-Host "OK governance DB: static accounts + employee register" -ForegroundColor Green
