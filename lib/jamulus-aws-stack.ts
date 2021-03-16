import { BlockDeviceVolume, EbsDeviceVolumeType, Instance, InstanceType, MachineImage, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from '@aws-cdk/aws-ec2';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { Bucket } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

interface JamulusStackProps extends cdk.StackProps {
  keyPairName: string;
  sshCidrRange: string;
  jamulusPort: number;
  instanceType: string;
}

export class JamulusAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: JamulusStackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'JamulusVpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: 'public',
          subnetType: SubnetType.PUBLIC
        }
      ]
    });

    // Create user data for EC2 instance and unit file
    // TODO: download script for user data instead of inline commands
    const unitFileAsset = new Asset(this, 'UnitFile', {
      path: "./config/jamulus.service"
    });
    const userData = UserData.forLinux();
    userData.addCommands(
      "sudo apt update",
      "sudo apt-get install awscli build-essential qt5-qmake qtdeclarative5-dev qt5-default qttools5-dev-tools libjack-jackd2-dev -y",
    );
    userData.addS3DownloadCommand({
      bucket: Bucket.fromBucketName(this, 'UnitFileBucket', unitFileAsset.s3BucketName),
      bucketKey: unitFileAsset.s3ObjectKey,
      localFile: '/etc/systemd/system/jamulus.service'
    });
    userData.addCommands(
      "wget https://github.com/corrados/jamulus/archive/latest.tar.gz",
      "tar -xvf latest.tar.gz",
      "cd jamulus-latest",
      "qmake \"CONFIG+=nosound headless\" Jamulus.pro",
      "make clean && make",
      "sudo make install",
      "sudo adduser --system --no-create-home jamulus",
      "sudo chmod 644 /etc/systemd/system/jamulus.service",
      "sudo systemctl start jamulus",
      "sudo systemctl enable jamulus",
    );

    // Security group for inbound ssh and public Jamulus port
    const securityGroup = new SecurityGroup(this, 'JamulusSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(Peer.ipv4(props.sshCidrRange), Port.tcp(22), "Local SSH")
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.udp(props.jamulusPort), "Public Jamulus")

    const machineImage = MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20201026',
      owners: ['099720109477']
    });
    const instance = new Instance(this, 'JamulusInstance', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PUBLIC
      }),
      securityGroup: securityGroup,
      machineImage: machineImage,
      instanceType: new InstanceType(props.instanceType),
      blockDevices: [{
        deviceName: "/dev/sda1",
        volume: BlockDeviceVolume.ebs(8, {
          deleteOnTermination: true,
          volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD
        }),
      }],
      keyName: props.keyPairName,
      userData: userData,
      userDataCausesReplacement: true
    });
    unitFileAsset.grantRead(instance);
  }
}
