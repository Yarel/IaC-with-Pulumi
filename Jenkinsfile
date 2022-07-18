node {
    stage('Preparation') {
        git 'https://github.com/Yarel/IaC-with-Pulumi.git'
    }
    stage('install'){
        sh 'npm install' // Dependency Installation stage
    }
    stage('Scan') {
        snykSecurity organisation: 'prashant.b', projectName: 'nodejs_demo_snyk', severity: 'medium', snykInstallation: 'Snyk', snykTokenId: '87cd2da3-ccfa-46f7-b7d4-d115b400422c', targetFile: 'package.json'
    }
    stage('Build') {
        echo "Build"
    }
    stage('Results') {
        echo "Test Result"
    }
}
