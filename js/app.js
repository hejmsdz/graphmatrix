(function() {
    angular.module('GraphMatrix', [])
        .directive('matrix', function() {
            return {
                templateUrl: 'matrix.html',
                restrict: 'E',
                scope: {
                    vertices: '=vertices',
                    edges: '=edges',
                    explainI: '=explaini',
                    explainJ: '=explainj',
                },
                link: function (scope, el, attrs) {
                    var vertices = scope.vertices;
                    var edges = scope.edges;
                    var matrixExpl = [];

                    scope.setExplain = function(i, j) {
                        scope.explainI = i;
                        scope.explainJ = j;
                        if (i >= 0 && j >= 0) {
                            scope.explain = matrixExpl[i][j];
                            scope.val = scope.matrix[i][j];
                        }
                    }
                    scope.matrix = [];
                    scope.matrixClass = [];
                    scope.range = [];
                    for (i=0; i<=vertices+1; i++) {
                        scope.range.push(i);
                        scope.matrix.push(new Array(vertices+1));
                        scope.matrixClass.push(new Array(vertices+1));
                        matrixExpl.push(new Array(vertices+1));
                    }

                    matrixExpl[0][0] = matrixExpl[0][vertices+1] = matrixExpl[vertices+1][0] = matrixExpl[vertices+1][vertices+1] = 'empty';

                    var succ = {};
                    var pred = {};
                    for (i=0; i<edges.length; i++) {
                        var a = edges[i][0];
                        var b = edges[i][1];
                        if (a in succ) {
                            succ[a].push(b);
                        } else {
                            succ[a] = [b];
                        }
                        if (b in pred) {
                            pred[b].push(a);
                        } else {
                            pred[b] = [a];
                        }
                    }

                    for (i=1; i<=vertices; i++) {
                        var nonadj = {};
                        for (j=1; j<=vertices; j++) nonadj[j] = 1;

                        // successors list
                        var index = vertices+1;

                        if (!succ[i]) {
                            scope.matrix[i][index] = 0;
                            scope.matrix[index][i] = 0;
                            scope.matrixClass[i][index] = 'success';
                            scope.matrixClass[index][i] = 'success';
                            matrixExpl[i][index] = 'succ-start-empty';
                            matrixExpl[index][i] = 'succ-end-empty';
                        } else {
                            for (j=0; j<succ[i].length; j++) {
                                scope.matrix[i][index] = succ[i][j];
                                if (j > 0) {
                                    scope.matrix[i][index] += vertices;
                                    matrixExpl[i][index] = 'succ-list';
                                } else {
                                    matrixExpl[i][index] = 'succ-list-first';
                                }
                                scope.matrixClass[i][index] = 'success';
                                index = succ[i][j];
                                delete nonadj[index];
                            }
                            scope.matrix[i][index] = vertices+index;
                            scope.matrixClass[i][index] = 'success';
                            scope.matrix[vertices+1][i] = index;
                            scope.matrixClass[vertices+1][i] = 'success';
                            matrixExpl[i][index] = 'succ-list-last';
                            matrixExpl[vertices+1][i] = 'succ-end';
                        }

                        // predecessors list
                        index = 0;
                        if (!pred[i]) {
                            scope.matrix[i][index] = 0;
                            scope.matrix[index][i] = 0;
                            scope.matrixClass[i][index] = 'info';
                            scope.matrixClass[index][i] = 'info';
                            matrixExpl[i][index] = 'pred-start-empty';
                            matrixExpl[index][i] = 'pred-end-empty';
                        } else {
                            for (j=0; j<pred[i].length; j++) {
                                scope.matrix[i][index] = pred[i][j];
                                if (j==0) {
                                    matrixExpl[i][index] = 'pred-list-first';
                                } else {
                                    matrixExpl[i][index] = 'pred-list';
                                }
                                scope.matrixClass[i][index] = 'info';
                                index = pred[i][j];
                                delete nonadj[index];
                            }
                            scope.matrix[i][index] = index;
                            scope.matrixClass[i][index] = 'info';
                            matrixExpl[i][index] = 'pred-list-last';
                            scope.matrix[0][i] = index;
                            scope.matrixClass[0][i] = 'info';
                            matrixExpl[0][i] = 'pred-end';
                        }

                        // non-adjacency list
                        nonadjArr = Object.keys(nonadj).filter(function(x) { return x != i; });
                        if (!nonadjArr.length) {
                            scope.matrix[i][i] = -i;
                            scope.matrixClass[i][i] = 'danger';
                            matrixExpl[i][i] = 'nonadj-start-empty';
                        } else {
                            scope.matrix[i][i] = -nonadjArr[0];
                            scope.matrixClass[i][i] = 'danger';
                            matrixExpl[i][i] = 'nonadj-start';

                            index = nonadjArr[0];
                            for (j=1; j<nonadjArr.length; j++) {
                                scope.matrix[i][index] = -nonadjArr[j];
                                scope.matrixClass[i][index] = 'danger';
                                matrixExpl[i][index] = 'nonadj-list';
                                index = nonadjArr[j];
                            }
                            scope.matrix[i][index] = -index;
                            scope.matrixClass[i][index] = 'danger';
                            matrixExpl[i][index] = 'nonadj-list-last';
                        }
                    }

                }
            }
        })
        .directive('graph', function() {
            function getGraph(vertices, edges) {
                vertArr = [];
                for (i=1; i<=vertices; i++) {
                    vertArr.push({id: i, label: ''+i});
                }

                edgeArr = [];
                for (i=0; i<edges.length; i++) {
                    edgeArr.push({id: edges[i][0]+'-'+edges[i][1], from: edges[i][0], to: edges[i][1]});
                }

                return {
                    nodes: new vis.DataSet(vertArr),
                    edges: new vis.DataSet(edgeArr)
                };
            }

            return {
                restrict: 'E',
                scope: {
                    vertices: '=vertices',
                    edges: '=edges',
                    selectI: '=selecti',
                    selectJ: '=selectj',
                },
                link: function (scope, el, attrs) {
                    var network = new vis.Network(el[0], {}, {
                        height: '300px',
                        layout: {randomSeed: 54916846},
                        nodes: {
                            color: {
                                highlight: {
                                    border: 'red'
                                }
                            },
                        },
                        edges: {arrows: 'to'}
                    });
                    //scope.$watch('edges', function() {
                        network.setData(getGraph(scope.vertices, scope.edges));
                    //}, true);

                    scope.$watch('[selectI,selectJ]', function() {
                        var verts = [];

                        if (scope.selectI > 0 && scope.selectI <= scope.vertices) {
                            verts.push(scope.selectI);
                        }
                        if (scope.selectJ > 0 && scope.selectJ <= scope.vertices) {
                            verts.push(scope.selectJ);
                        }

                        network.setSelection({
                            nodes: verts
                        }, {unselectAll: true, highlightEdges: false});
                    });

                }
            }
        }).controller('GraphMatrixController', ['$scope', function($scope) {
            $scope.vertices = 5;
            $scope.edges = [[1,2], [1,4], [3,2], [3,4], [3,5], [4,5], [5,1], [5,2]];
            // $scope.edges = [[1,2], [2,4], [2,5], [3,1], [3,2], [4,3], [5,1], [5,4]];
        }]);
})();
