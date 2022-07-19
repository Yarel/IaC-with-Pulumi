pipeline {
    agent any
    environment {
        SNYK_TOKEN = credentials('SNYK_ID_TOKEN') 
    }
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                branch 'master'
                environment name: 'DEPLOY_TO', value: 'production'
            }
            steps {
                echo 'Deploying'
                git url: 'https://github.com/Yarel/IaC-with-Pulumi.git', branch: 'master'
		sh 'cd /var/lib/jenkins/workspace/snyk-plugin'
		sh 'snyk test --all-projects '
            }
        }
    }
}
