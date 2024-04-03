@echo off

start cmd /k sass --watch public/scss:public/css

start cmd /k http-server -c-1 -p5345