import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
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
const config = new pulumi.Config();
let keyName:pulumi.Input<string> = config.get("keyName");
const publicKey= config.get("publicKey");
const privateKey = config.requireSecret("privateKey").apply(key => {
    if (key.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {return key;} 
    else {return Buffer.from(key, "base64").toString("ascii");}});

const privateKeyPassphrase = config.getSecret("privateKeyPassphrase");
let ami = aws.getAmi({
    filters: [{
      name: "name",
      values: ["amzn-ami-hvm-*"],
    }],
    owners: ["137112412989"], 
    mostRecent: true,
});
if (!keyName) {
    const key = new aws.ec2.KeyPair("KeySSH",{publicKey});
    keyName = key.keyName;}

const genereteEC2=(name:string,ami:string,assosiatepublic:boolean,Subnet:aws.ec2.Subnet,sg:aws.ec2.SecurityGroup)=>{
    return new aws.ec2.Instance(name,{
        instanceType:"t2.micro",
        ami:ami,
        associatePublicIpAddress:assosiatepublic,
        subnetId:Subnet.id,
        vpcSecurityGroupIds:[sg.id],
        keyName:keyName,
        tags:{Name:name}
      });
};
const sg_Bastion = new aws.ec2.SecurityGroup("SecurityGroup-Bastion", {
  tags:{Name:"sg-Bastion"},
  ingress: [
      {protocol: "tcp", fromPort: 22,toPort: 22, cidrBlocks:["0.0.0.0/0"]},
      {protocol: "tcp", fromPort: 8888,toPort: 8888, cidrBlocks:["10.0.0.0/16"]},
            ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: [ "0.0.0.0/0" ] }],
  vpcId:vpc.id,
});
const sg_private = new aws.ec2.SecurityGroup("SecurityGroup-private", {
  tags:{Name:"sg-private"},
  ingress: [
      {protocol: "tcp", fromPort: 22,toPort: 22, cidrBlocks:["10.0.0.0/16"]},
      {protocol: "tcp", fromPort: 80,toPort: 80, cidrBlocks:["10.0.0.0/16"]},
      {protocol: "tcp", fromPort: 3306,toPort: 3306, cidrBlocks:["10.0.0.0/16"]}],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: [ "0.0.0.0/0" ] }],
  vpcId:vpc.id,
});
const bastion=genereteEC2("bastion-1a","ami-0eb89db7593b5d434",true,subnetPublic,sg_Bastion,);
const app=genereteEC2("App-1b","ami-0eb89db7593b5d434",false,subnetPrivate_b,sg_private,);
const app2=genereteEC2("App-2c","ami-0eb89db7593b5d434",false,subnetPrivate_c,sg_private,);

//////////////////////////////////////////////////////////////////////////////////////////////////
const subnetRDS = generateSubnet("default","10.0.80.0/24", vpc,'us-east-1a');
const sg_rds = new aws.ec2.SecurityGroup("SecurityGroup-rds", {
    tags:{Name:"sg-rds"},
    ingress: [
        {protocol: "tcp", fromPort: 3306,toPort: 3306, cidrBlocks:["10.0.20.0/24"]},],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: [ "0.0.0.0/0" ] }],
    vpcId:vpc.id,
  });
const subnetGrouprds= new aws.rds.SubnetGroup("subnetgroup", {
  subnetIds: [
        subnetRDS.id,
        subnetPrivate_b.id,
  ],
  tags: {Name: 'sgrds',},
});
const rds = new aws.rds.Instance("myrdsinstances", {
  tags:{name:'rds-mysql'},
    allocatedStorage: 20,
    engine: "mysql",
    engineVersion: "5.7",
    instanceClass: "db.t2.micro",
    name: "mydb",
    parameterGroupName: "default.mysql5.7",
    password: "cloudlapaz",
    storageType: "gp2",
    username: "root",
    publiclyAccessible:false,
  dbSubnetGroupName:subnetGrouprds.id,
  vpcSecurityGroupIds:[sg_rds.id]
});
//////////////////////////////////////////////////////////////////////////////////////////////////
export const bastionPublicIP=bastion.publicIp;
export const bastionPrivate=bastion.privateIp;
export const appPrivate=app.privateIp;
export const app2Private=app2.privateIp;
export const EndPoint_RDS=rds.endpoint;
