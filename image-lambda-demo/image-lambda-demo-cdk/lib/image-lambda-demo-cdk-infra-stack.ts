import {CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import {Topic} from "aws-cdk-lib/aws-sns";
import {SnsDestination} from "aws-cdk-lib/aws-s3-notifications";

export class ImageLambdaDemoCdkInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const colorImageBucket = new Bucket(this, 'color-image-your-uuid', {
      bucketName: 'color-image-your-uuid',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true
    });
    const colorImageBucketArn = colorImageBucket.bucketArn;
    new CfnOutput(this, 'colorImageBucketArn', {
      value: colorImageBucketArn,
      exportName: 'color-image-your-uuid',
      description: 'Arn of color image bucket'
    });

    const blackAndWhiteImageBucket = new Bucket(this, 'black-and-white-image-your-uuid', {
      bucketName: 'black-and-white-image-your-uuid',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true
    });
    const blackAndWhiteImageBucketArn = blackAndWhiteImageBucket.bucketArn;
    new CfnOutput(this, 'blackAndWhiteImageBucketArn', {
      value: blackAndWhiteImageBucketArn,
      exportName: 'black-and-white-image-your-uuid',
      description: 'Arn of black and white image bucket'
    });

    const sepiaImageBucket = new Bucket(this, 'sepia-image-your-uuid', {
      bucketName: 'sepia-image-your-uuid',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true
    });
    const sepiaImageBucketArn = sepiaImageBucket.bucketArn;
    new CfnOutput(this, 'sepiaImageBucketArn', {
      value: sepiaImageBucketArn,
      exportName: 'sepia-image-your-uuid',
      description: 'Arn of sepia image bucket'
    });

    const snsTopic = new Topic(this, 'image-received', {
      topicName: 'image-received',
      displayName: 'Image received'
    });
    const snsTopicArn = snsTopic.topicArn;
    new CfnOutput(this, 'imageReceivedSnsTopicArn', {
      value: snsTopicArn,
      exportName: 'image-received',
      description: 'Arn of image received sns topic'
    });

    colorImageBucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(snsTopic));
  }
}
