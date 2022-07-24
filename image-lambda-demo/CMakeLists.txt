cmake_minimum_required(VERSION 3.22)
project(image_lambda_demo)

set(CMAKE_CXX_STANDARD 20)

find_package(aws-lambda-runtime REQUIRED)
find_package(AWSSDK REQUIRED COMPONENTS s3)
find_package(OpenCV REQUIRED)

add_executable(black_and_white_lambda_demo black_and_white_lambda_demo.cpp)
target_link_libraries(black_and_white_lambda_demo PRIVATE
        AWS::aws-lambda-runtime
        ${AWSSDK_LINK_LIBRARIES}
        ${OpenCV_LIBS})

target_include_directories(black_and_white_lambda_demo PRIVATE
        /opt/aws-lambda-cpp/include/
        /opt/aws-sdk-cpp/include/
        /usr/local/include/opencv4/)

aws_lambda_package_target(black_and_white_lambda_demo NO_LIBC)

add_executable(sepia_lambda_demo sepia_lambda_demo.cpp)
target_link_libraries(sepia_lambda_demo PRIVATE
        AWS::aws-lambda-runtime
        ${AWSSDK_LINK_LIBRARIES}
        ${OpenCV_LIBS})

target_include_directories(sepia_lambda_demo PRIVATE
        /opt/aws-lambda-cpp/include/
        /opt/aws-sdk-cpp/include/
        /usr/local/include/opencv4/)

aws_lambda_package_target(sepia_lambda_demo)
