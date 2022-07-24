import {Duration, Fn, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {Topic} from "aws-cdk-lib/aws-sns";
import {LambdaSubscription} from "aws-cdk-lib/aws-sns-subscriptions";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

export class ImageLambdaDemoCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const blackAndWhiteLambdaDemo = new Function(this, 'black-and-white-lambda-demo', {
      runtime: Runtime.PROVIDED_AL2,
      handler: 'my_handler',
      code: Code.fromAsset(path.join(__dirname,
          '../../cmake-build-release-docker-aws-sdk-cpp-opencv-455/black_and_white_lambda_demo.zip')),
      functionName: 'blackAndWhiteLambdaDemo',
      memorySize: 512,
      logRetention: RetentionDays.THREE_DAYS,
      timeout: Duration.seconds(30)
    });

    const sepiaLambdaDemo = new Function(this, 'sepia-lambda-demo', {
      runtime: Runtime.PROVIDED_AL2,
      handler: 'my_handler',
      code: Code.fromAsset(path.join(__dirname,
          '../../cmake-build-release-docker-aws-sdk-cpp-opencv-455/sepia_lambda_demo.zip')),
      functionName: 'sepiaLambdaDemo',
      memorySize: 512,
      logRetention: RetentionDays.THREE_DAYS,
      timeout: Duration.seconds(30)
    });

    const snsTopicArn = Fn.importValue('image-received');
    const snsTopic = Topic.fromTopicArn(this, 'image-received', snsTopicArn);
    snsTopic.addSubscription(new LambdaSubscription(blackAndWhiteLambdaDemo));
    snsTopic.addSubscription(new LambdaSubscription(sepiaLambdaDemo));

    const colorImageBucketArn = Fn.importValue('color-image-your-uuid');
    const colorImageBucket = Bucket.fromBucketArn(this, 'color-image-your-uuid', colorImageBucketArn);
    colorImageBucket.grantRead(blackAndWhiteLambdaDemo);
    colorImageBucket.grantRead(sepiaLambdaDemo);

    const blackAndWhiteImageBucketArn = Fn.importValue('black-and-white-image-your-uuid');
    const blackAndWhiteImageBucket = Bucket.fromBucketArn(this, 'black-and-white-image-your-uuid', blackAndWhiteImageBucketArn);
    blackAndWhiteImageBucket.grantReadWrite(blackAndWhiteLambdaDemo);

    const sepiaImageBucketArn = Fn.importValue('sepia-image-your-uuid');
    const sepiaImageBucket = Bucket.fromBucketArn(this, 'sepia-image-your-uuid', sepiaImageBucketArn);
    sepiaImageBucket.grantReadWrite(sepiaLambdaDemo);
  }
}
