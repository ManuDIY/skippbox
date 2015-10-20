/*
 Copyright 2015 Skippbox, Ltd

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

kuiApp.controller("podController", function ($rootScope, $scope, k8s, $filter, contextService, NgTableParams) {
    var self = this;

//    $scope.$watch($rootScope.client, function () {
//        alert('root changed');
//        refreshPods();
//    }, true);
//

    function refreshPods() {
        $scope.podsReady = false;
        contextService.getConnection().pods.get(function (err, plist) {
            if (!err && plist.length > 0) {
                var pd = plist[0];
                $scope.pods = []
                for (var i = 0; i < pd.items.length; i++) {
                    $scope.pods.push({pod: pd.items[i], id: "pod_" + i})
                }
                console.log('pods:', $scope.pods);
                self.tableParams = new NgTableParams({ count: 5}, { counts: [5, 10, 25], data: $scope.pods});
            }
            else {
                console.log("Error fetching pods" + err);
            }
        });
        $scope.podsReady = true;
    }

    $scope.setLabelStr = function (l) {
        $scope.labelStr = JSON.stringify(l);
    }

    $scope.updateLabel = function (l, p) {

        contextService.getConnection().pods.get(p, function (err, p1) {
            if (!err) {
                var oldlabel = p1.metadata.labels;
                p1.metadata.labels = JSON.parse(l);
                var newlabel = p1.metadata.labels;
                contextService.getConnection().pods.update(p, p1, function (err, pnew) {
                    if (!err) {
                        console.log('pod: ' + JSON.stringify(pnew));
                    } else {
                        console.log('pod: ' + JSON.stringify(err));
                        alert(JSON.stringify(err.message.message));
                    }
                });
            } else {
                console.log(err);
                alert("Failed to get the resource.");
            }
        });

        $scope.labelStr = null;
    }

    $scope.$watch('jsonData', function (json) {
        $scope.pStr = $filter('json')(json);
    }, true);

    $scope.$watch('pStr', function (json) {
        try {
            $scope.jsonData = JSON.parse(json);
            $scope.wellFormed = true;
        } catch (e) {
            $scope.wellFormed = false;
        }
    }, true);

    $scope.createPod = function (npStr) {

        var newpod = JSON.parse(npStr);

        contextService.getConnection().pods.create(newpod, function (err, p1) {
            if (!err) {
                console.log('pod: ' + JSON.stringify(p1));
            } else {
                console.log('pod: ' + JSON.stringify(err));
                alert(JSON.stringify(err.message.message));
            }
            $scope.newPod = false;
        });
    }

    $scope.updatePod = function (id, pStr, p) {

        contextService.getConnection().pods.get(p, function (err, p1) {
            if (!err) {
                var newpod = JSON.parse(pStr);
                contextService.getConnection().pods.update(p, newpod, function (err, pnew) {
                    if (!err) {
                        console.log('pod: ' + JSON.stringify(pnew));
                    } else {
                        console.log('pod: ' + JSON.stringify(err));
                        alert(JSON.stringify(err.message.message));
                    }
                });
            } else {
                console.log(err);
                alert("Failed to get the resource.");
            }
        });

        $scope["pod_" + id] = true;

        $scope.labelStr = null;
    }

    $scope.editPod = function (id, pod) {
        for (var i = 0; i < $scope.pods.length; i++) {
            if (("pod_" + i) == id && pod) {
                $scope[id] = true;
                $scope.pStr = $filter('json')(pod);
            }
            else {
                $scope["pod_" + i] = false;
            }
        }
    }

    var ws = contextService.getWebSocket('pods')

    ws.onopen = function () {
        console.log("Socket has been opened!");
    };

    ws.onmessage = function (message) {
        listener(JSON.parse(message.data));
    };

    function listener(data) {
        var messageObj = data;
        if (data) {
            console.log("Received data from websocket: ", messageObj);
            refreshPods();
        }
    }

    refreshPods();

    $scope.start = function (pod) {
        alert("Start invoked for:".concat(pod));
    }

    $scope.stop = function (pod) {
        alert("Stop invoked.".concat(pod));
    }

    $scope.cancelCreateBtn = function () {
        $scope.newPod = false;
    }

    $scope.cancelBtn = function (id, pod) {
        for (var i = 0; i < $scope.pods.length; i++) {
            if (("pod_" + i) == id && pod) {
                $scope[id] = true;
                $scope.pStr = $filter('json')(pod);
            }
            else {
                $scope["pod_" + i] = false;
            }
        }
    }

    $scope.delete = function (pod) {
        contextService.getConnection().pods.delete(pod, function (err) {
            if (err) {
                console.log('Delete failed:' + err);
            }
            else {
                console.log('Delete successful.');
            }
        });
    }


});
