import numpy as np

from dataclasses import dataclass, field
import math

def __sigmoid__(arr:np.ndarray):
    return 1 / (1 + np.exp(-arr))
def __log_odds__(p:float):
    return math.log(1/1-p)

@dataclass
class __Desicion__:
    feature_index: int
    corte: float
    gain:float
    


@dataclass
class __Node__:
    desicion: __Desicion__ = None

    indices_izquierda: np.ndarray = field(
        default_factory=lambda: np.array([], dtype=np.int64)
    )

    indices_derecha: np.ndarray = field(
        default_factory=lambda: np.array([], dtype=np.int64)
    )

    weight: float = None


def __score__(G,H,lambda_param):
    return (1/2)*(G**2/(H+lambda_param))
def __optimized_weight__(G,H,lambda_param):
    return -G/(H+lambda_param)
def __get_best_split__(
    x_train,
    gradient,
    hessian,
    active_indexes,
    index,
    global_order,
    lambda_param,
    gamma_param,
    min_child_weight
  
):
    # Values of feature of the current data
    
    order_global=global_order[:, index]
    mask = np.isin(order_global, active_indexes)
    order = order_global[mask]
    
    sorted_column = x_train[order, index]
    G_sorted=gradient[order]
    H_sorted=hessian[order]
    #y_sorted = y_train[order]

    last_value = sorted_column[0]
    if last_value == sorted_column[-1]:
        return None
    total = len(sorted_column)
    #print(sorted_column)

    best_gain = None
    G_cum = np.cumsum(G_sorted)
    H_cum = np.cumsum(H_sorted)
    G_total = G_cum[-1]
    H_total = H_cum[-1]
    for i, value in enumerate(sorted_column):

        if value != last_value:

            G_left = G_cum[i - 1]
            H_left = H_cum[i - 1]

            G_right = G_total - G_left
            H_right = H_total - H_left
    
            if H_left >= min_child_weight and H_right >= min_child_weight:
    
                score_l = __score__(G_left, H_left, lambda_param)
                score_r = __score__(G_right, H_right, lambda_param)
                score_parent = __score__(
                    G_total,
                    H_total,
                    lambda_param
                )
    
                gain = score_l + score_r - score_parent - gamma_param
    
                if best_gain is None or gain > best_gain:
                    best_split = (value + last_value) / 2
                    best_cut_position = i
                    best_gain = gain

        last_value = value

       
    if best_gain is None:
        return None
    desicion = __Desicion__(
        feature_index=index,
        corte=best_split,
        gain=best_gain
    )

    best_nodo = __Node__(
        desicion=desicion
    )

    best_nodo.indices_derecha = (
        order[best_cut_position:]
    )

    best_nodo.indices_izquierda = (
        order[:best_cut_position]
    )

    return best_nodo


def __get_best_characterictic__(
    X_train,
    gradient,
    hessian,
    active_indexes,
    global_order,
    lambda_param,
    gamma_param,
    min_child_weight
):
    max_caracteristic_gain = None
    best_characteristic = None


    # Iterate over columns
    for index in range(len(X_train[0])):

        best_desicion = __get_best_split__(
            X_train,
            gradient,
            hessian,
            active_indexes,
            index,
            global_order,
            lambda_param,
            gamma_param,
            min_child_weight
        )

        if (
            not best_desicion is None
            and (
                max_caracteristic_gain is None
                or best_desicion.desicion.gain
                > max_caracteristic_gain
            )
        ):
            max_caracteristic_gain = best_desicion.desicion.gain
            

            best_characteristic = best_desicion

    return best_characteristic


def __build_tree__(
    X_train,
    gradient,
    hessian,
    active_indexes,
    depth,
    global_order,
    lambda_param,
    gamma_param,
    min_child_weight
):
        
    

    #print(type(hessian))
    flag_hoja = False
    
    if depth == 0:
        flag_hoja = True

    else:
        raiz = __get_best_characterictic__(
            X_train,
            gradient,
            hessian,
            active_indexes,
            global_order,
            lambda_param,
            gamma_param,
            min_child_weight
        
        )

    if flag_hoja or raiz is None or raiz.desicion.gain <= 0:
        G=gradient[active_indexes]
        H=hessian[active_indexes]
        weight = __optimized_weight__(sum(G),sum(H),lambda_param)
        
        raiz = __Node__(
            weight=weight
        )

    else:
        
        
        raiz.left = __build_tree__(
            X_train,
            gradient,
            hessian,
            raiz.indices_izquierda,
          
         
            depth - 1,
         
            global_order,
            lambda_param,
            gamma_param,
            min_child_weight
        )

        raiz.right = __build_tree__(
            X_train,
            gradient,
            hessian,
            raiz.indices_derecha,
         
          
            depth - 1,
        
            global_order,
            lambda_param,
            gamma_param,
            min_child_weight
        )

        raiz.indices_izquierda = []
        raiz.indices_derecha = []

    return raiz
def tree_walk(tree, X_test):
    
    prediction=[]
    for registro in X_test:
        nodo = tree
        
        while nodo.weight is None:
           
            
            if (
                        registro[
                            nodo.desicion.feature_index
                        ]
                        <= nodo.desicion.corte
                    ):
                nodo=nodo.left
            else:
                nodo=nodo.right
        prediction.append(nodo.weight)
    return np.array(prediction)


class XGBoostModel():
    def __init__(
    self,
    depth_trees: int = 3,
    learning_rate: float = 0.01,
    n_trees: int = 15,
    lambda_param: float = 1.0,
    gamma_param: float = 0.0,
    min_child_weight: float = 1.0,
    
    ):
        self.depth_trees = depth_trees
        self.learning_rate = learning_rate
        self.n_trees = n_trees
        self.lambda_param = lambda_param
        self.gamma_param = gamma_param
        self.min_child_weight = min_child_weight
       
        
    def fit(self,X_train,y_train):
        self.DecisionTrees=[]
        
        self.actual_prediction=None
        #rng = np.random.default_rng(seed=67)
        n_1= sum(y_train)
        
        p_1 = n_1/len(y_train)
        self.base_prediction = __log_odds__(p_1)
        self.actual_prediction=np.empty(len(y_train))
        self.actual_prediction.fill(self.base_prediction)
        
        global_order = np.argsort(
            X_train,
            axis=0
        )
        for _ in range(self.n_trees):
            #print(type(self.actual_prediction))
            sigmoide=__sigmoid__(self.actual_prediction)
            gradient = sigmoide-y_train
            hessian = sigmoide*(1-sigmoide)
            
            self.DecisionTrees.append(__build_tree__(X_train,gradient,hessian,range(len(y_train)),self.depth_trees,
                                                 global_order,self.lambda_param,self.gamma_param,self.min_child_weight))
            
            self.actual_prediction+=self.learning_rate*tree_walk(self.DecisionTrees[-1],X_train)
            #print(np.mean((y_train - self.actual_prediction) ** 2))
        
    def predict(self,X_test):
        res= self.base_prediction 
        for arbol in self.DecisionTrees:
            res+=self.learning_rate*tree_walk(arbol,X_test)
        probabilities=__sigmoid__(res)
        return probabilities
        #return (probabilities >= self.threshold).astype(int) ###predictions
        