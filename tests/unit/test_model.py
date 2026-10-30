
import math

import numpy as np
import pytest

import churn_prediction.model as model_module


@pytest.fixture
def simple_data():
    """Dataset pequeño con una separación clara entre clases."""
    X = np.array(
        [[0.0], [1.0], [2.0], [3.0]]
    )
    y = np.array([0, 0, 1, 1])

    return X, y


# ==========================================
# Funciones matemáticas
# ==========================================

def test_sigmoid_returns_expected_values():
    values = np.array([-1.0, 0.0, 1.0])

    result = model_module.__sigmoid__(values)

    expected = np.array([
        1 / (1 + np.exp(1)),
        0.5,
        1 / (1 + np.exp(-1)),
    ])

    np.testing.assert_allclose(result, expected)


def test_log_odds_returns_correct_value():
    # log(0.5 / (1 - 0.5)) = 0
    assert model_module.__log_odds__(0.5) == pytest.approx(0.0)

    # log(0.8 / (1 - 0.8)) = log(4)
    assert model_module.__log_odds__(0.8) == pytest.approx(
        math.log(4)
    )


def test_score_uses_expected_formula():
    result = model_module.__score__(
        G=2.0,
        H=3.0,
        lambda_param=1.0,
    )

    # 0.5 * 2^2 / (3 + 1) = 0.5
    assert result == pytest.approx(0.5)


def test_optimized_weight_uses_expected_formula():
    result = model_module.__optimized_weight__(
        G=2.0,
        H=3.0,
        lambda_param=1.0,
    )

    # -2 / (3 + 1) = -0.5
    assert result == pytest.approx(-0.5)


# ==========================================
# Búsqueda de divisiones
# ==========================================

def test_get_best_split_finds_expected_cut():
    X = np.array(
        [[0.0], [1.0], [2.0], [3.0]]
    )

    gradient = np.array([-1.0, -1.0, 1.0, 1.0])
    hessian = np.ones(4)
    active_indexes = np.arange(4)
    global_order = np.argsort(X, axis=0)

    result = model_module.__get_best_split__(
        x_train=X,
        gradient=gradient,
        hessian=hessian,
        active_indexes=active_indexes,
        index=0,
        global_order=global_order,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=1.0,
    )

    assert result is not None
    assert result.desicion.feature_index == 0
    assert result.desicion.corte == pytest.approx(1.5)
    assert result.desicion.gain == pytest.approx(4 / 3)

    np.testing.assert_array_equal(
        result.indices_izquierda,
        np.array([0, 1]),
    )

    np.testing.assert_array_equal(
        result.indices_derecha,
        np.array([2, 3]),
    )


def test_get_best_split_returns_none_for_constant_feature():
    X = np.ones((4, 1))

    gradient = np.array([-1.0, -1.0, 1.0, 1.0])
    hessian = np.ones(4)
    active_indexes = np.arange(4)
    global_order = np.argsort(X, axis=0)

    result = model_module.__get_best_split__(
        x_train=X,
        gradient=gradient,
        hessian=hessian,
        active_indexes=active_indexes,
        index=0,
        global_order=global_order,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=1.0,
    )

    assert result is None


def test_get_best_split_respects_min_child_weight():
    X = np.array(
        [[0.0], [1.0], [2.0], [3.0]]
    )

    gradient = np.array([-1.0, -1.0, 1.0, 1.0])
    hessian = np.ones(4)
    active_indexes = np.arange(4)
    global_order = np.argsort(X, axis=0)

    result = model_module.__get_best_split__(
        x_train=X,
        gradient=gradient,
        hessian=hessian,
        active_indexes=active_indexes,
        index=0,
        global_order=global_order,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=3.0,
    )

    # No split can place at least 3 units of Hessian
    # in both children when the total is only 4.
    assert result is None


def test_get_best_characteristic_selects_valid_feature():
    X = np.array([
        [0.0, 5.0],
        [1.0, 5.0],
        [2.0, 5.0],
        [3.0, 5.0],
    ])

    gradient = np.array([-1.0, -1.0, 1.0, 1.0])
    hessian = np.ones(4)
    active_indexes = np.arange(4)
    global_order = np.argsort(X, axis=0)

    result = model_module.__get_best_characterictic__(
        X_train=X,
        gradient=gradient,
        hessian=hessian,
        active_indexes=active_indexes,
        global_order=global_order,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=1.0,
    )

    assert result is not None
    assert result.desicion.feature_index == 0
    assert result.desicion.corte == pytest.approx(1.5)


# ==========================================
# Recorrido del árbol
# ==========================================

def test_tree_walk_follows_correct_branch():
    root = model_module.__Node__(
        desicion=model_module.__Desicion__(
            feature_index=0,
            corte=1.5,
            gain=1.0,
        )
    )

    root.left = model_module.__Node__(weight=-0.5)
    root.right = model_module.__Node__(weight=0.75)

    X_test = np.array([
        [1.0],
        [2.0],
        [1.5],
        [1.6],
    ])

    result = model_module.tree_walk(root, X_test)

    expected = np.array([
        -0.5,
        0.75,
        -0.5,
        0.75,
    ])

    np.testing.assert_allclose(result, expected)


# ==========================================
# Entrenamiento y predicción
# ==========================================

def test_fit_creates_requested_number_of_trees(simple_data):
    X, y = simple_data

    model = model_module.XGBoostModel(
        depth_trees=1,
        learning_rate=0.3,
        n_trees=3,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=1.0,
    )

    model.fit(X, y)

    assert len(model.DecisionTrees) == 3


def test_predict_returns_valid_probabilities(simple_data):
    X, y = simple_data

    model = model_module.XGBoostModel(
        depth_trees=1,
        learning_rate=0.3,
        n_trees=3,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=1.0,
    )

    model.fit(X, y)
    probabilities = model.predict(X)

    assert probabilities.shape == (len(X),)
    assert np.isfinite(probabilities).all()
    assert np.all(probabilities >= 0.0)
    assert np.all(probabilities <= 1.0)


def test_model_learns_simple_separation(simple_data):
    X, y = simple_data

    model = model_module.XGBoostModel(
        depth_trees=1,
        learning_rate=0.3,
        n_trees=5,
        lambda_param=1.0,
        gamma_param=0.0,
        min_child_weight=0.1,
    )

    model.fit(X, y)
    probabilities = model.predict(X)
 
    # Customers belonging to the positive class
    # should receive greater probabilities here.
    assert probabilities[0] < probabilities[-1]


def test_fit_again_replaces_previous_trees(simple_data):
    X, y = simple_data

    model = model_module.XGBoostModel(
        depth_trees=1,
        learning_rate=0.3,
        n_trees=2,
    )

    model.fit(X, y)
    assert len(model.DecisionTrees) == 2

    model.fit(X, y)

    # Calling fit again should not append another
    # 2 trees to the existing ensemble.
    assert len(model.DecisionTrees) == 2
