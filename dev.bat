@echo off

start cmd /k sass --watch public/scss:public/css

start cmd /k http-server -c-1 -p5345

echo "Hello 0"

start cmd /k code .

start http://localhost:5345

exit