import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi"

const vpc = new aws.ec2.Vpc("VPC", {
  cidrBlock: "10.0.0.0/16",
  tags: { Name: "vpc" }
});

const InternetGateway = new aws.ec2.InternetGateway("InternetGateway", {
  vpcId: vpc.id,
  tags: { Name: 'InternetGateway' }
});
const generateSubnet = (name: string, cidr: string, vpc: aws.ec2.Vpc, Zone:string) => {
  return new aws.ec2.Subnet(name, {
    cidrBlock: cidr,
    availabilityZone:Zone,
    tags:{Name:name},
    vpcId: vpc.id
  });
};

const subnetPublic = generateSubnet("SubnetPublic-1a", "10.0.10.0/24", vpc,'us-east-1a');
const subnetPrivate_b= generateSubnet("SubnetPrivate-1b", "10.0.20.0/24", vpc,'us-east-1b');
const subnetPrivate_c= generateSubnet("SubnetPrivate-1c", "10.0.30.0/24", vpc,'us-east-1c');

const routetablePublic= new aws.ec2.RouteTable('RouteTable-Public',{
    routes:[
      {
        cidrBlock:'0.0.0.0/0',
        gatewayId: InternetGateway.id
      }
    ],
    vpcId:vpc.id
});
const assosiationRoutT_Subnet= new aws.ec2.RouteTableAssociation('AssociationRouteTables-SubnetPublic',{
    routeTableId: routetablePublic.id,
    subnetId:subnetPublic.id
});
