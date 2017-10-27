
def doBuild() {
    stage('build') {
        def image = docker.build("ssp25/sspcloud")
        image.push("ssp25/sspcloud:786")
    }
}

node ('docker') {
    checkout scm

    stage(name: 'delivery') {
        checkout([$class: 'GitSCM', branches: [[name: "*/master"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'delivery']], submoduleCfg: [], userRemoteConfigs: [[url: 'https://github.com/sspper/image-doc.git']]])
    }

    try {
        
        withCredentials([usernamePassword(credentialsId: 'ssp25')]) {
            sh "docker login -u ssp25 -p Password@54321"
        }
        doBuild() // You implement doBuild

        
    } catch (e) {
        currentBuild.result = "FAILED"
        echo "${e.getClass().getName()} - ${e.getMessage()}"
        throw e
    }
}
