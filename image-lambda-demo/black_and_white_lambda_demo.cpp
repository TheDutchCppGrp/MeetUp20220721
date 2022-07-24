#include <aws/lambda-runtime/runtime.h>
#include <aws/core/utils/json/JsonSerializer.h>
#include <aws/core/Aws.h>
#include <aws/core/utils/logging/LogMacros.h>
#include <aws/core/utils/logging/ConsoleLogSystem.h>
#include <aws/core/client/ClientConfiguration.h>
#include <aws/core/platform/Environment.h>
#include <aws/core/auth/AWSCredentialsProvider.h>
#include <aws/s3/S3Client.h>
#include <aws/s3/model/PutObjectRequest.h>
#include <aws/s3/model/GetObjectRequest.h>
#include <opencv2/core.hpp>
#include <opencv2/core/cvdef.h>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/core/hal/interface.h>
#include <fstream>

char const TAG[] = "BLACK_AND_WHITE_LAMBDA_DEMO";

std::pair<std::string, std::string> getS3BucketAndObjectName(Aws::Utils::Json::JsonView json) {
    auto sns = json.GetArray("Records").GetItem(0).GetObject("Sns");
    auto message = sns.GetString("Message");

    Aws::Utils::Json::JsonValue messageJson(message);
    auto s3 = messageJson.View()
            .GetArray("Records")
            .GetItem(0)
            .GetObject("s3");
    auto bucket = s3.GetObject("bucket").GetString("name");
    auto key = s3.GetObject("object").GetString("key");

    return std::make_pair(bucket, key);
}

std::vector<uchar> retrieveImageFromS3(std::string const& bucket, std::string const& key, Aws::S3::S3Client const& client) {
    Aws::S3::Model::GetObjectRequest object_request;
    object_request.SetBucket(bucket);
    object_request.SetKey(key);

    Aws::S3::Model::GetObjectOutcome get_object_outcome = client.GetObject(object_request);

    std::vector<uchar> data;

    if (get_object_outcome.IsSuccess()) {
        auto &retrieved_file = get_object_outcome.GetResultWithOwnership().GetBody();

        char item;
        while (!retrieved_file.eof()) {
            retrieved_file.get(item);
            data.push_back(item);
        }
    } else {
        auto const& err = get_object_outcome.GetError();
        std::string error = "Error: GetObject: ";
        error.append(err.GetExceptionName())
            .append(": ")
            .append(err.GetMessage());
        AWS_LOGSTREAM_ERROR(TAG, error)
    }
    return data;
}

static aws::lambda_runtime::invocation_response my_handler(aws::lambda_runtime::invocation_request const& req, Aws::S3::S3Client const& client) {
    AWS_LOGSTREAM_DEBUG(TAG, "Started my_handler.")
    Aws::Utils::Json::JsonValue payload(req.payload);

    auto item = getS3BucketAndObjectName(payload.View());
    const std::string bucket = item.first;
    std::string key = item.second;

    size_t pos = key.find('+');
    while(pos != std::string::npos) {
        key.replace(pos, 1, " ");
        pos = key.find('+');
    }
    AWS_LOGSTREAM_INFO(TAG, "S3Bucket: " << bucket << "/Key: " << key)

    auto result = retrieveImageFromS3(bucket, key, client);

    std::vector<uchar> imgVector;

    cv::Mat imgMatrix = cv::imdecode(result, cv::IMREAD_COLOR);
    if (!imgMatrix.empty()) {
        //result -> transform to black and white
        cv::Mat outputMat;
        cv::cvtColor(imgMatrix, outputMat, cv::COLOR_BGR2GRAY);
        cv::imencode(".png", outputMat, imgVector);
    }
    Aws::S3::Model::PutObjectRequest request;
    request.SetBucket("black-and-white-image-your-uuid");
    request.SetKey(key);

    const std::shared_ptr<Aws::IOStream> input_data = Aws::MakeShared<Aws::StringStream>("");
    for (auto character : imgVector) {
        *input_data << character;
    }

    request.SetBody(input_data);
    client.PutObject(request);

    AWS_LOGSTREAM_DEBUG(TAG, "my_handler ready.")
    AWS_LOGSTREAM_FLUSH()
    return aws::lambda_runtime::invocation_response::success("Success" /*payload*/, "application/json" /*MIME type*/);
}

std::function<std::shared_ptr<Aws::Utils::Logging::LogSystemInterface>()> GetConsoleLoggerFactory() {
    return [] {
        return Aws::MakeShared<Aws::Utils::Logging::ConsoleLogSystem>(
                "console_logger", Aws::Utils::Logging::LogLevel::Info);
    };
}

int main() {
    Aws::SDKOptions sdkOptions;
    sdkOptions.loggingOptions.logger_create_fn = GetConsoleLoggerFactory();
    sdkOptions.loggingOptions.logLevel = Aws::Utils::Logging::LogLevel::Info;
    sdkOptions.loggingOptions.logger_create_fn = GetConsoleLoggerFactory();
    Aws::InitAPI(sdkOptions);
    {
        Aws::Client::ClientConfiguration config;
        config.region = Aws::Environment::GetEnv("AWS_REGION");

        auto credentialsProvider = Aws::MakeShared<Aws::Auth::EnvironmentAWSCredentialsProvider>(TAG);
        Aws::S3::S3Client client(credentialsProvider, config);

        AWS_LOGSTREAM_DEBUG(TAG, "About to go into run_handler")
        auto handler_fn = [&client](aws::lambda_runtime::invocation_request const& req) {
            return my_handler(req, client);
        };
        aws::lambda_runtime::run_handler(handler_fn);
    }
    Aws::ShutdownAPI(sdkOptions);
    return 0;
}