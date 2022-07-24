# Speaker Notes AWS SDK for C++

## Preparation
	Start Docker Desktop
	Login to AWS in Safari in it's own window
	
Go to [categories](https://aws.amazon.com/products/?hp=tile&so-exp=below&aws-products-all.sort-by=item.additionalFields.productNameLowercase&aws-products-all.sort-order=asc&awsf.re%3AInvent=*all&awsf.Free%20Tier%20Type=*all&awsf.tech-category=*all) in it's own safari window

Go to [C++ SDK](https://docs.aws.amazon.com/sdk-for-cpp/v1/developer-guide/welcome.html) in a tab in previous Safari window

	Open CheatSheet.txt in CLion
Check presentation mode in CLion when on the beamer/large screen.

	Open iTerm

## Introduction
Have you ever wondered what does cloud computing and serverless provide you as a software developer that creates software with C++? Tonight we are going to talk about AWS Cloud Computing and specifically a serverless solution build with C++.

I've been working actively with Azure and AWS. The last two years I worked exclusively with the AWS Cloud. I'm very interested in using serverless concepts and compiled languages. Both cloud providers offer serverless solutions that can run native binaries; applications or functions developed in C++. 

I'm Hans Klabbers I work at Rabobank where I'm a Solution Architect for a bunch off applications that help Rabobank provide services to large corporates. 

Today I will talk about AWS Services and show a demo serverless solution developed in C++. The solution will use AWS Lambda, but it will also use other AWS services to show how services can work together on this cloud platform. Before we go into the demo I'm going to talk a bit about the serverless concepts (Lambda, DynamoDB, RDS Serverless, SNS) and some of the available AWS services.

No Servers! This is of course not true. My personal way of looking at it; it just means you don't have to think about servers yourself. But it is handy that you know how servers operate anyway. You don't think about hardware procurement, hardware installation and software installation. You have to think about application infrastructure, application development and application deployment (which sometimes also means software installation only done differently).

Serverless Definition by AWS. Just to provide you with a formal definition by this cloud provider.


## Introduction to AWS
AWS provides services across several categories. It will cost too much time to go into detail for every category. The top categories are:
1. Compute
2. Storage
3. Database
4. Networking & Content Delivery
5. Analytics
6. Machine Learning
7. Security, Identity & Compliance

Switch to browser and show these [categories](https://aws.amazon.com/products/?hp=tile&so-exp=below&aws-products-all.sort-by=item.additionalFields.productNameLowercase&aws-products-all.sort-order=asc&awsf.re%3AInvent=*all&awsf.Free%20Tier%20Type=*all&awsf.tech-category=*all)

Each service has it's own characteristics and based on these characteristics you decide on it's applicability for your application. So depending on your workload you decide what to use. When you look at the Compute category you see EC2, which is just a virtual machine and some services for autoscaling to up- and downscale VM's. But you see also Lambda and EC2 Spot instances. Explore other services (click through the top categories).

EC2 versus Lambda
I'm a fan of serverless. It is easy to work with, you hardly have to think about the configuration. When compared with for instance EC2 it is very limted what you have to configure. See for instance the CLI command for creating an EC2 instance. By the way; Everything you do with the configuration is an API call. All services are configured via their API. The command line interface calls the API, the web console calls the same API and the SDK calls the same API. The API for [EC2](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/Welcome.html) looks like this. Let's look at the [run-instances](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RunInstances.html) command that you need to use to create a virtual machine. I will not go through all options. The choice of types of VM's is very large. You can make a choice for general purpose, cpu optimized and memory optimzed. You have a choice to use a shared instance (this is running on a server that hosts VM's for other AWS clients) or dedicated (where only VM's are running for your (company)account). The latter is of course more expensive. Next to that you have to decide on a so called [AMI](Amazon Machine Image). This is the image that is used for the VM. After that you have to install the software you need.
See here the commands needed to create an EC2 instance:

	aws ec2 create-key-pair --key-name MyKeyPair --query 'KeyMaterial' --output text > MyKeyPair.pem

The key pair is needed later to access the EC2 instance. Then you need to create a security group. This is the next command.

	aws ec2 create-security-group --group-name my-sg \
	--description "My security group" --vpc-id vpc-1a2b3c4d

Then you can create the actual VM (example is AL2 in Frankfurt):

	aws ec2 run-instances --image-id ami-0233214e13e500f77 --count 1 --instance-type t2.micro \
	--key-name MyKeyPair --security-group-ids sg-903004f8 --subnet-id subnet-6e7f829e

When you want to install software on the VM, you have to create a user.dat file that is used during creation of the AMI to setup the instance. See this example for an user.dat file:

	#!/bin/bash
	yum update -y
	yum install -y httpd.x86_64
	systemctl start httpd.service
	systemctl enable httpd.service
	echo “Hello World from $(hostname -f)” > /var/www/html/index.html

And now you also have to maintain the OS (via the installed AM), which means installing all security updates and other software updates. This can be done by either installing stuff, with the keys you can access the instance via ssh or by getting an updated AMI and recycle your instance with a new AMI. But it is YOUR responsibility now.
If time allows, I can show this at the end of the demo when people want to observe the process. REMARK: perhaps do the implementation with EC2 instead of Lambda!!!

When looking at Lambdas, this is the CLI to create a lambda. After the deployment of this lambda, it is directly auto scaling. You don't need to do anything for that. The platform is regularly updated with security and other updates by AWS, this NOT YOUR responsibility anymore. You are only responsible for what you are running yourself on this platform.

The following is the CLI command to deploy a Lambda.

	aws iam create-role — role-name basic-lambda-role \
	— assume-role-policy-document file://trust-policy.json

	aws lambda create-function \
    	--function-name basic-lambda \
    	--runtime nodejs14.x \
    	--zip-file fileb://basic-lambda-role.zip \
    	--handler basic-lambda.handler \
    	--role arn:aws:iam:***:role/basic-lambda-role
 
Looking at the **Compute** spectrum of services within AWS. The EC2 is in the server region, AWS Lambda is in the serverless region. But there is something in the middle of both ends of this spectrum. That is AWS Fargate. Also known as serverless containers. To work with AWS Fargate you have to create a container that contains your software. You don't have to worry about the server it is running on (as opposed to having EC2 with docker on it). You provide it with an image from ECR, a task configuration (memory and vCPU setting) and a cluster to run on. It is very easy to scale the solution up and down based on metrics of the running container(s). I don't want to say that one is beter than the other; all three have their place in the world. Depending on your workload you make a choice for one of the possible compute solutions. When using Lambda you have to take cold start times into account, so if a relative low latency is needed, then EC2 or Fargate is your solution.

For today's demo we will use Amazon S3 (Simple Storage Service), Amazon SNS (Simple Notification Service), AWS Lambda, Amazon CloudWatch and AWS CloudFormation together with CDK (Cloudformation development Kit). Some parts of the demo are prepared upfront, because it will cost too much time to do that during the talk. All code is shared via the Meetup repo (see [github](https://github.com/TheDutchCppGrp)).

## Introduction AWS SDK for C++
AWS provides a C++ SDK for their services. This SDK contains the functionality to work with AWS services from C++ programs. It contains clients for accessing services and functions to do something usefull with these services. Minimium C++ version is 11. Later in this talk it will be shown how to use some of the services with the SDK. But as an example see the following code to create a list of all objects in a certain S3 Bucket. Show in a CLion project and run it.

	Aws::S3Crt::S3CrtClient s3_crt_client(config);
	Aws::S3Crt::Model::ListBucketsOutcome outcome = s3CrtClient.ListBuckets();
	if (outcome.IsSuccess()) {
        std::cout << "All buckets under my account:\n";

        for (auto const& bucket : boutcome.GetResult().GetBuckets()) {
            std::cout << "  * " << bucket.GetName() << "\n";
        }
	} else {
        std::cout << "ListBuckets error:\n"<< outcome.GetError() << "\n";
	}

The SDk can be compiled with cmake. As always, you can create shared or static libraries. You can instruct make to build only the libraries that you indicate with a cmake parameter. Of course you have to compile the SDK for your target platform. 

There is a separately delivered SDK for C++ Lambda Runtime. This SDK will be used in the demo later in this talk. You can use this SDK to create Lambdas you deploy to AWS Lambda serverless computing. With this SDK you can create the package you upload to the AWS Lambda service.

## Introduction to the demo with AWS Lambda
My development environment is CLion. I'm using cmake 3.23.2, clang 14.0.4, AWS C++ SDK 1.9.268 and Lambda SDK 0.2.7. For AWS development I created a Docker setup with Amazon Linux 2. This is the linux version that is used for the AWS Lambda environment. I use static libraries. Depending on how much functionality you use from the libraries it can be more efficient to use dynamic libraries and create a layer with these libraries. Based on my expectations of the lifecycle of the compiler and SDK's I created an image with different layers. aws-cpp-clang is the base image for aws-lambda-cpp which is the base image for aws-sdk-cpp. This hierarchy is based on the expectations that the compiler is not as often updated as the lambda cpp runtime which will probably have fewer updates then aws-sdk-cpp. For convenience I compiled **all** SDK modules in the image. These are ready for use after creating the Docker image. I created an additional image with OpenCV compiled as static libs. This image is based on aws-sdk-cpp image. This is the image used for development for the demo.

CLion starts the image automatically in a container when it needs to compile and/or run the application. See [CLion remote developement with docker](https://www.jetbrains.com/help/clion/clion-toolchains-in-docker.html#build-run-debug-docker).

The demo application will produce two images the first image is a black and white image. The second image is a sepia image (third is fluoriscent colors?). The worklow is the following: upload an color image to S3 (color-image-*uuid*) with the AWS console. This will trigger an SNS message that is published to *image-received* topic. Two lambdas have a subscription for that. Both lambdas will be triggered. They receive the message. One lambda will create the black and white image and the other one will create the sepia image. The black and white image will be delivered to S3 (black-and-white-image-*uuid*) and the sepia image will be delivered to S3 (sepia-image-*uuid*). The result can be checked by downlading the produced images and show them.

The development workflow is the following. Create the lambdas and then create the AWS infrastructure (S3 buckets, SNS publish and subscribe channels and the Lambdas). Deployment of everything will be done with CDK (CloudFormation Development Kit). A bit of overkill for this demo, but a good practice in professional environments. CDK can be run from CI/CD pipelines. I used CDK with typescript for this demo.

## Let's get started
CMake must be adjusted to be able to generate the lambda package. Add

	find_package(aws-lambda-runtime REQUIRED)
	
	add_executable(black_and_white_lambda_demo black_and_white_lambda_demo.cpp aws_constants.h)
	
	target_link_libraries(black_and_white_lambda_demo PRIVATE AWS::aws-lambda-runtime)
	
	aws_lambda_package_target(black_and_white_lambda_demo NO_LIBC)
to CMakeLists.txt. This is needed for the lambda zip file creation. The zip file contains the binary and the lambda runtime. This runtime provides the interface between the binary and the lambda platform. I use NO_LIBC for aws_lambda_package_target to make the package smaller, you can only do that when you use a linux AMI that is [supported](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) by AWS lambda. If you ommit that then the zip file will contain libc that was used when compiling the lambda. Show the CMakeLists.txt file in CLion.
	
When using the Lambda C++ Runtime you will create Lambdas with the following structure. A main function as entrypoint to the lambda. This basically sets the configuration to be used for clients and creates the clients (be aware that these settings are shared with next invocations of the Lambda). This needs some explanation, When a Lambda has been started and finished processing request it will not immediately stopped and *deleted*. It will wait for a certain period before it is deleted. AWS doesn't disclose for how long. Testing learned that it will stay alive for around 10 minutes. The same instance will be re-used, meaning that the handler function in the demo case my_handler will be called directly without starting in main!

The main function calls the my_handler function with the invocation request parameter. Depending on the type of integration a certain payload will be delivered to the *my_handler* function. This payload is a json. Show the parsing in the source code.

For Lambda you should use

	auto credentialsProvider = Aws::MakeShared<Aws::Auth::EnvironmentAWSCredentialsProvider>(TAG);
	
This is needed, because the credentials that are used by the client are provided to the Lambda via environment variables by definition! The DefaultCredentialProviderChain is able to find the credentials on this location, but it first tries to find the credentials on the filesystem and EC2 metadata. ANd you know upfront that they are not in these locations. This way you Lambda is 'faster' and therefore cheaper.

Depending on the platform you use to compile the Lambda the ca certificates will be stored in a different location. Under the hood the SDK uses the curl libraries for all http calls (and everyting is an http call on AWS) and depending on the platform curl expects the ca-bundle in a certain location. AWS communicates that on Lambda the ca-bundle is in the location as shown here (which is the same location as in the AL2 docker image). If that is different in your case, you can add the following config item in your main function. This has to be done before the handler is started.

	Aws::Client::ClientConfiguration config;
	config.caFile = "/etc/pki/tls/certs/ca-bundle.crt";

Deployments are done with cdk. See the following code. I made the choice for cdk with typescript. Two so called stacks are created one with infrastructure and one with the lambdas. This split is made, because the infrastructure stacks are more difficult to change. My experience is that infrastructure components as buckets, sns topics or log groups cannot be deleted or replaced due to the data that is possibly in there. Let's look at the code. When you are using a new account or have never used cdk; make sure that you execute cdk bootstrap!

	cdk deploy --profile your-profile --all --require-approval never


Remark Advanced Vector Extensions 2 (AVX2) is available and gives you SIMD.

# CLI and other commands

CLion IDE switch to presentation mode ^⌥`
iTerm/Safari bigger font ⌘+, normal font ⌘0, smaller font ⌘-
Keynote switch play/non-play ⌥⌘p

	aws s3 ls --profile hans-dev

	aws s3 cp ~/meetup/tropical.png s3://color-image-9e6a73f2-5914-4397-937f-803f00a78102/ --profile hans-dev

	aws s3 rm s3://color-image-9e6a73f2-5914-4397-937f-803f00a78102/tropical.png --profile hans-dev

	aws sns confirm-subscription --topic-arn [arn] --token [token] 
	curl [subscription confirmation url]

	ssh -i ~/Downloads/ec2-key-pair.pem ec2-user@ip
	
Show images

	aws s3 ls --profile hans-dev
	aws s3 ls s3://color-image-9e6a73f2-5914-4397-937f-803f00a78102 —profile hans-dev
	aws s3 cp ~/meetup/tropical.png s3://color-image-9e6a73f2-5914-4397-937f-803f00a78102/ --profile hans-dev
	aws s3 ls s3://black-and-white-image-9e6a73f2-5914-4397-937f-803f00a78102 —profile hans-dev
	aws s3 ls s3://sepia-image-9e6a73f2-5914-4397-937f-803f00a78102 —profile hans-dev
	aws s3 cp s3://black-and-white-image-9e6a73f2-5914-4397-937f-803f00a78102/tropical.png tropical-black-and-white.png
	aws s3 cp s3://sepia-image-9e6a73f2-5914-4397-937f-803f00a78102/tropical.png tropical-sepia.png
