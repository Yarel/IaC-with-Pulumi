import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
let group = new aws.ec2.SecurityGroup("Ubuntu-SecurityGroup", {
    ingress: [
        {protocol: "tcp", fromPort: 80,toPort: 80, cidrBlocks:["0.0.0.0/0"]},
        {protocol: "tcp", fromPort: 22,toPort: 22, cidrBlocks:["0.0.0.0/0"]},
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: [ "0.0.0.0/0" ] }],
});
let ami = aws.getAmi({
    filters: [{
      name: "name",
      values: ["amzn-ami-hvm-*"],
    }],
    owners: ["137112412989"], 
    mostRecent: true,
});
const config = new pulumi.Config();
let keyName:pulumi.Input<string> = config.get("keyName");
const publicKey= config.get("publicKey");
const privateKey = config.requireSecret("privateKey").apply(key => {
    if (key.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
        return key;
    } else {
        return Buffer.from(key, "base64").toString("ascii");
    }
});
const privateKeyPassphrase = config.getSecret("privateKeyPassphrase");
if (!keyName) {
    const key = new aws.ec2.KeyPair("KeySSH",{publicKey});
    keyName = key.keyName;
}
const server = new aws.ec2.Instance("Ubuntu-Server", {
    instanceType: "t2.micro",
    ami: "ami-0f56279347d2fa43e",
    keyName: keyName,
    vpcSecurityGroupIds: [ group.id ], 
});
export const publicIp = server.publicIp;
export const publicHostName = server.publicDns;  