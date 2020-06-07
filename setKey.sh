#!/bin/bash
cat ec2.pub | pulumi config set publicKey --
cat ec2 | pulumi config set privateKey --secret --
pulumi config set aws:region ca-central-1
echo 'ok'