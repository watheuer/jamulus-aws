import { BlockDeviceVolume, Vpc, Instance, EbsDeviceVolumeType, InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType, SecurityGroup, Peer, Port } from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

const keyPairName = process.env.KEY_PAIR_NAME;
const localCidrRange = process.env.LOCAL_CIDR_RANGE;

export class JamulusAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket = new s3.Bucket(this, 'JamulusBucket', {});
    const vpc = new Vpc(this, 'JamulusVpc', {
      maxAzs: 1
    });

    const securityGroup = new SecurityGroup(this, 'JamulusSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(Peer.ipv4(localCidrRange!), Port.tcp(22), "Local SSH")

    const jamulusServer = new Instance(this, 'JamulusInstance', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PUBLIC
      }),
      securityGroup: securityGroup,
      machineImage: MachineImage.lookup({
        name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20201026',
        windows: false,
        owners: ['099720109477']
      }),
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      blockDevices: [{
        deviceName: "/dev/sda1",
        volume: BlockDeviceVolume.ebs(24, {
          deleteOnTermination: false,
          volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD
        }),
      }],
      keyName: keyPairName
    });
  }
}
