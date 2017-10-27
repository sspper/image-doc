


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
        delivery.notify("Starting")
        withCredentials([usernamePassword(credentialsId: 'ssp25')]) {
            sh "docker login -u ssp25 -p Password@54321"
        }
        doBuild(delivery) // You implement doBuild

        delivery.notify("SUCCESS")
    } catch (e) {
        currentBuild.result = "FAILED"
        echo "${e.getClass().getName()} - ${e.getMessage()}"
        delivery.notifyFailure("${e.getClass().getName()} - ${e.getMessage()}")
        throw e
    }
}
