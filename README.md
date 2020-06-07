# Infrastructure as code in AWS

## Running the Example

First, create a stack, using `pulumi stack init`.

Now, we need to ensure that our dependencies are installed:

```
$ npm install
``` 

Next, generate an OpenSSH keypair for use with your server - as per the AWS [Requirements][1]

```
$ ssh-keygen -t rsa -f ec2
```

This will output two files, `ec2` and `ec2.pub`, in the current directory. Be sure not to commit these files!

We then need to configure our stack so that the public key is used by our EC2 instance, and the private key used
for subsequent SCP and SSH steps that will configure our server after it is stood up.

```
$ cat ec2.pub | pulumi config set publicKey --
$ cat ec2 | pulumi config set privateKey --secret --
```

If your key is protected by a passphrase, add that too:

```
$ pulumi config set privateKeyPassphrase --secret [yourPassphraseHere]
```

Notice that we've used `--secret` for both `privateKey` and `privateKeyPassphrase`. This ensures their are
stored in encrypted form in the Pulumi secrets system.

Also set your desired AWS region:

```
$ pulumi config set aws:region us-east-1
```
or you can run 
```
$ bash setKey.sh
```
From there, you can run `pulumi up` and all resources will be provisioned and configured.
